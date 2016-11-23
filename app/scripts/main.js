$( document ).ready(function() {
  // console.log( "ready!" );
  $('.work-gallery').slick({
    // autoplay: true,
    // autoplaySpeed: 2000,
    settings: {
      // Hide arrows on small size
      arrows: false
    },
    responsive: [
      {
        // This should be em but doesn't work
        breakpoint: 640,
        slidesToShow: 2,
        slidesToScroll: 1,
        settings: { arrows: true }
      }
    ]
  });
});
