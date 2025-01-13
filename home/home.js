document.addEventListener('DOMContentLoaded', () => {
    initializeSlider();
    lucide.createIcons();
});

function initializeSlider() {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.slide-dot');
    const prevButton = document.querySelector('.slide-arrow.prev');
    const nextButton = document.querySelector('.slide-arrow.next');
    let currentSlide = 0;
    let slideInterval;

    // Initialize automatic sliding
    startSlideShow();

    // Add click events for dots
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            goToSlide(index);
            resetInterval();
        });
    });

    // Add click events for arrows
    prevButton.addEventListener('click', () => {
        goToSlide(currentSlide - 1);
        resetInterval();
    });

    nextButton.addEventListener('click', () => {
        goToSlide(currentSlide + 1);
        resetInterval();
    });

    // Pause slideshow on hover
    const sliderContainer = document.querySelector('.hero-slider');
    sliderContainer.addEventListener('mouseenter', () => {
        clearInterval(slideInterval);
    });

    sliderContainer.addEventListener('mouseleave', () => {
        startSlideShow();
    });

    function goToSlide(index) {
        // Handle circular navigation
        if (index < 0) index = slides.length - 1;
        if (index >= slides.length) index = 0;

        // Remove active classes
        slides[currentSlide].classList.remove('active');
        dots[currentSlide].classList.remove('active');

        // Add active classes to new slide
        slides[index].classList.add('active');
        dots[index].classList.add('active');

        currentSlide = index;
    }

    function startSlideShow() {
        slideInterval = setInterval(() => {
            goToSlide(currentSlide + 1);
        }, 5000); // Change slide every 5 seconds
    }

    function resetInterval() {
        clearInterval(slideInterval);
        startSlideShow();
    }

    // Handle keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            goToSlide(currentSlide - 1);
            resetInterval();
        } else if (e.key === 'ArrowRight') {
            goToSlide(currentSlide + 1);
            resetInterval();
        }
    });

    // Add touch support for mobile devices
    let touchStartX = 0;
    let touchEndX = 0;

    sliderContainer.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, false);

    sliderContainer.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, false);

    function handleSwipe() {
        const swipeThreshold = 50;
        const swipeLength = touchEndX - touchStartX;

        if (Math.abs(swipeLength) > swipeThreshold) {
            if (swipeLength > 0) {
                // Swiped right
                goToSlide(currentSlide - 1);
            } else {
                // Swiped left
                goToSlide(currentSlide + 1);
            }
            resetInterval();
        }
    }
}