$( document ).ready(function() {
    // console.log( "ready!" );
    $('.work-gallery').slick({
      responsive: [
        {
          breakpoint: 768,
          settings: {
            arrows: false,
            centerMode: true,
            centerPadding: '20px',
            slidesToShow: 1
          }
        }
      ]
    });
});
