// SELECT

const citySelect = document.querySelector('#city');
const cityChoices = new Choices(citySelect, {
  searchEnabled: false,
  itemSelectText: '',
});

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
      open({ btn: e.target });
    }
    modal.style.visibility = 'visible';
    modal.style.opacity = 1;
    window.addEventListener('keydown', closeModal);
    scrollController.disabledScroll();
  }

  btnElems.forEach(btn => {
    btn.addEventListener('click', openModal);
  })

  modal.addEventListener('click', closeModal);
  modal.closeModal = closeModal;
  modal.openModal = openModal;

  return { openModal, closeModal };
}

const init = () => {
  modalController({
    modalElem: '.modal',
    btnOpen: '.vacancy',
    btnClose: '.modal__close',
  });
}

init();