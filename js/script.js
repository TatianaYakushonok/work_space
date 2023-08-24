
const API_URL = "https://workspace-methed.vercel.app/";
const LOCATION_URL = "api/locations";
const VACANCY_URL = "api/vacancy";

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
  const cardsList = document.querySelector('.cards__list');
  const btnElems = document.querySelectorAll(btnOpen);
  const modal = document.querySelector(modalElem);

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

  /*cardsList.addEventListener('click', (e) => {
    const vacancyCard = e.target.closest(btnOpen);
    console.log(vacancyCard);
    if (!vacancyCard) return;
    vacancyCard.addEventListener('click', openModal);
  })*/

  btnElems.forEach(btn => {
    btn.addEventListener('click', openModal);
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

const renderVacancy = (data, cardsList) => {
  cardsList.textContent = '';
  const cards = createCards(data);
  cardsList.append(...cards);
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

const init = async () => {

  // SELECT
  const citySelect = document.querySelector('#city');
  const cityChoices = new Choices(citySelect, {
    itemSelectText: '',
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
  const cardsList = document.querySelector('.cards__list');
  const url = new URL(`${API_URL}${VACANCY_URL}`);

  getData(url, (data) => {
    renderVacancy(data, cardsList);
  }, 
    renderError);

  const getDataVacancy = async () => {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  }

  const data = await getDataVacancy();
  console.log(data);

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

init();