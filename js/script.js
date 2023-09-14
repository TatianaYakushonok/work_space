
const API_URL = "https://workspace-methed.vercel.app/";
const LOCATION_URL = "api/locations";
const VACANCY_URL = "api/vacancy";

let lastUrl =``;
const pagination = {};

const getData = async (url, cbSuccess, cbError) => {
  try {
    const response = await fetch(url);
    const data = await response.json();
    cbSuccess(data);
  } catch (error) {
    cbError(error);
  }
}

/*fetch(API_URL + LOCATION_URL)
  .then((response) => {
    return response.json();
  })
  .then(data => {
    console.log(data);
  })
  .catch(err => {
    console.log(err);
  })*/

// MODAL

const scrollController = {
  scrollPosition: 0,
  disabledScroll() {
    scrollController.scrollPosition = window.scrollY;
    document.body.style.cssText = `
      overflow: hidden;
      position: fixed;
      top: -${scrollController.scrollPosition}px;
      left: 0;
      width: 100vw;
      height: 100vh;
      padding-right: ${window.innerWidth - document.body.offsetWidth}px
    `;
    document.documentElement.style.scrollBehavior = 'unset';
  },
  enabledScroll() {
    document.body.style.cssText = '';
    window.scroll({ top: scrollController.scrollPosition});
    document.documentElement.style.scrollBehavior = '';
  }
}

const modalController = ({ modalElem, btnOpen, btnClose, time = 300, open, close }) => {
  const btnElems = document.querySelectorAll(btnOpen);
  const modal = document.querySelector(modalElem);
  console.log(btnElems);
  modal.style.cssText = `
    display: flex;
    visibility: hidden;
    opacity: 0;
    transition: opacity ${time}ms ease-in-out;
  `;

  const closeModal = (e) => {
    const target = e.target;

    if (e === 'close' ||
        target === modal ||
        (btnClose && target.closest(btnClose)) || 
        e.code === 'Escape') {
      modal.style.opacity = 0;

      setTimeout(() => {
        modal.style.visibility = 'hidden';
        scrollController.enabledScroll();

        if (close) {
          close();
        }
      }, time);

      window.removeEventListener('keydown', closeModal);
    }

  }

  const openModal = (e) => {

    if (open) {
      open({ btn: e.target.closest(btnOpen) });
    }
    modal.style.visibility = 'visible';
    modal.style.opacity = 1;
    window.addEventListener('keydown', closeModal);
    scrollController.disabledScroll();
  }

  btnElems.forEach(btn => {
    if (btn.closest(btnOpen)) {
      btn.addEventListener('click', openModal);
    }
  })

  modal.addEventListener('click', closeModal);
  modal.closeModal = closeModal;
  modal.openModal = openModal;

  return { openModal, closeModal };
}

const createCard = (vacancy) => 
  `<article class="vacancy" tabindex="0" data-id=${vacancy.id}>
    <img src="${API_URL}${vacancy.logo}" alt="Логотип компании ${vacancy.company}" class="vacancy__img">
    <p class="vacancy__company">${vacancy.company}</p>
    <h2 class="vacancy__title">${vacancy.title}</h2>

    <ul class="vacancy__fields">
      <li class="vacancy__field">от ${parseInt(vacancy.salary).toLocaleString()}₽</li>
      <li class="vacancy__field">${vacancy.format}</li>
      <li class="vacancy__field">${vacancy.type}</li>
      <li class="vacancy__field">${vacancy.experience}</li>
    </ul>
  </article>`;

const createCards = ((data) =>
  data.vacancies.map(vacancy => {
    const li = document.createElement('li');
    li.classList.add('cards__item');
    li.insertAdjacentHTML('beforeend', createCard(vacancy));

    return li;
  })
)

const renderVacancy = (data) => {
  const cardsList = document.querySelector('.cards__list');
  cardsList.textContent = '';
  const cards = createCards(data);
  cardsList.append(...cards);

  if (data.pagination) {
    Object.assign(pagination, data.pagination);
  }

  observer.observe(cardsList.lastElementChild);
}

const renderMoreVacancies = (data) => {
  const cardsList = document.querySelector('.cards__list');
  const cards = createCards(data);
  cardsList.append(...cards);

  if (data.pagination) {
    Object.assign(pagination, data.pagination);
  }

  observer.observe(cardsList.lastElementChild);

  const { fillInModal: fillInModalAdd, resetModal: resetModalAdd } = addInfoInModal();

  modalController({
    modalElem: '.modal',
    btnOpen: '.vacancy',
    btnClose: '.modal__close',
    open({ btn }) {
      const id = btn.dataset.id;
      const item = data.vacancies.find(item => item.id.toString() === id);
      fillInModalAdd(item);
    },
    close: resetModalAdd,
  });
}

const loadMoreVacancies = () => {
  if (pagination.totalPages > pagination.currentPage) {
    const urlWithParams = new URL(lastUrl);
    urlWithParams.searchParams.set('page', pagination.currentPage + 1);
    urlWithParams.searchParams.set('limit', window.innerWidth < 768 ? 6 : 12);

    getData(urlWithParams, renderMoreVacancies, renderError)
      .then(() => lastUrl = urlWithParams);
  }
}

const renderError = err => {
  console.warn(err);
}

const addInfoInModal = () => {
  const modalImg = document.querySelector('.modal__img');
  const modalCompanyName = document.querySelector('.modal__company-name');
  const modalTitle = document.querySelector('.modal__title');
  const modalInfo = document.querySelector('.modal__info');
  const salary = document.querySelector('.salary');
  const type = document.querySelector('.type');
  const format = document.querySelector('.format');
  const experience = document.querySelector('.experience');
  const city = document.querySelector('.module__city');
  const modalLink = document.querySelector('.modal__link');

  const fillInModal = data => {
    modalImg.src = `${API_URL}${data.logo}`;
    modalImg.alt = `Логотип компании ${data.company}`;
    modalCompanyName.textContent = `${data.company}`;
    modalTitle.textContent = `${data.title}`;
    modalInfo.innerHTML = `${data.description.replace('\n', '<br>')}`;
    salary.textContent = `${parseInt(data.salary).toLocaleString()}₽`;
    type.textContent = `${data.type}`;
    format.textContent = `${data.format}`;
    experience.textContent = `${data.experience}`;
    city.textContent = `${data.location}`;
    modalLink.textContent = `${data.email}`;
    modalLink.href = `emailto: ${data.email}`;
  }

  const resetModal = () => {
    modalImg.src = '';
    modalImg.alt = '';
    modalCompanyName.textContent = '';
    modalTitle.textContent = '';
    modalInfo.textContent = '';
    salary.textContent = '';
    format.textContent = '';
    type.textContent = '';
    experience.textContent = '';
    city.textContent = '';
    modalLink.textContent = '';
  }

  return { fillInModal, resetModal };
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        loadMoreVacancies();
      }
    })
  }, {
    rootMargin: '100px'
  }
);

const openFilter = (e) => {
  const target = e.target;
  const vacanciesFilter = document.querySelector('.vacancies__filter');
  const vacansiesFilterBtn = document.querySelector('.vacancies__filter-btn');

  if (target) {
    vacanciesFilter.classList.toggle('vacancies__filter_active');
    vacansiesFilterBtn.classList.toggle('vacancies__filter-btn_active');
  }
}

const init = async () => {

  try {
    // SELECT
    const citySelect = document.querySelector('#city');
    const cityChoices = new Choices(citySelect, {
      itemSelectText: '',
      position: 'bottom',
      searchChoices: true,
    });

    getData(`${API_URL}${LOCATION_URL}`, 
      (locationData) => {
        const locations = locationData.map(location => ({
          value: location,
        }));
        cityChoices.setChoices(locations, 'value', 'label', true);
      }, 
      (err) => console.log(err));

    // CARDS
    const urlWithParams = new URL(`${API_URL}${VACANCY_URL}`);

    urlWithParams.searchParams.set('limit', window.innerWidth < 768 ? 6 : 12);
    urlWithParams.searchParams.set('page', 1);
    
    getData(urlWithParams, renderVacancy, renderError)
      .then(() => lastUrl = urlWithParams);

    // MODAL

    const getDataVacancy = async () => {
      const response = await fetch(urlWithParams);
      const data = await response.json();
      return data;
    }

    const data = await getDataVacancy();

    const { fillInModal: fillInModalAdd, resetModal: resetModalAdd } = addInfoInModal();

    modalController({
      modalElem: '.modal',
      btnOpen: '.vacancy',
      btnClose: '.modal__close',
      open({ btn }) {
        const id = btn.dataset.id;
        const item = data.vacancies.find(item => item.id.toString() === id);
        fillInModalAdd(item);
      },
      close: resetModalAdd,
    });

    // FILTER
    const filterForm = document.querySelector('.filter__form');
    const filterBtn = document.querySelector('.vacancies__filter-btn');

    filterForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const formData = new FormData(filterForm);
      const urlWithParam = new URL(`${API_URL}${VACANCY_URL}`);

      formData.forEach((value, key) => {
        urlWithParam.searchParams.append(key, value);
      })

      getData(urlWithParam, renderVacancy, renderError)
        .then(() => lastUrl = urlWithParams);
    })

    filterBtn.addEventListener('click', openFilter);
  } catch (error) {
    console.log('error: ', error);
    console.warn('мы не на стринице index.html');
  }

  try {
    const validationForm = form => {
      const validate = new JustValidate(form, {
        errorFieldCssClass: ['invalid'],
        errorLabelStyle: {
          color: '#f00',
        },
        errorsContainer: document.querySelector('.emploer__error'),
      });
      validate
      .addField('#logo', [
        {
          rule: 'minFilesCount',
          value: 1,
          errorMessage: 'Добавьте логотип'
        },
        {
          rule: 'files',
          value: {
            files: {
              extensions: ['jpeg', 'png', 'jpg'],
              maxSize: 102400,
              minSize: 1000,
              types: ['image/jpeg', 'image/png'],
            },
          },
          errorMessage: 'Размер файла должен быть не больше 100kb'
        }
      ])
      .addField('#company', [{
        rule: 'required', errorMessage: 'Заполните название компании'
      }])
      .addField('#title', [{
        rule: 'required', errorMessage: 'Заполните название вакансии'
      }])
      .addField('#salary', [{
        rule: 'required', errorMessage: 'Заполните заработную плату'
      }])
      .addField('#location', [{
        rule: 'required', errorMessage: 'Заполните город'
      }])
      .addField('#email', [
        {
          rule: 'email',
          errorMessage: 'Введите корректный email'
        },
        {
          rule: 'required',
          errorMessage: 'Заполните email'
        }
      ])
      .addField('#description', [{
        rule: 'required', errorMessage: 'Заполните описание вакансии'
      }])
      .addRequiredGroup('#format', 'Выберите формат работы')
      .addRequiredGroup('#experience', 'Выберите опыт работы')
      .addRequiredGroup('#type', 'Выберите занятость')
    }

    const fileController = () => {
      const file = document.querySelector('.file');
      const prewiev = file.querySelector('.file__prewiev');
      const input = file.querySelector('.file__input');

      input.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
          const src = URL.createObjectURL(e.target.files[0]);
          file.classList.add('file--active');
          prewiev.src = src;
          prewiev.style.display = 'block';
        }
        else {
          file.classList.remove('file--active');
          prewiev.src = '';
          prewiev.style.display = 'none';
        }
      })
    }

    const formControl = () => {
      const form = document.querySelector('.emploer__form');

      validationForm(form);

      form.addEventListener('submit', (e) => {
        e.preventDefault();
      })
    }

    formControl();
    fileController();
  } catch (error) {
    console.log('error: ', error);
    console.warn('мы не на стринице emploer.html');
  }
  
}

init();