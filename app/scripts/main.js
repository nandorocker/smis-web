$( document ).ready(function() {
  // console.log( "ready!" );

  // Count carousel instances on page (items with class .work-gallery)
  // Add a unique ID to each carousel
  var carouselCount = $('.work-gallery').length;

  // Slick Carousel Configuration

  var slickSettings = {
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
  };

  // Activate every carousel on the page
  for (i = 1; i <= carouselCount; i++){
    $('#gallery_' + i).slick(slickSettings);
  }
});
