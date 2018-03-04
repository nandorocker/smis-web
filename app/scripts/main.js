$( document ).ready(function() {
  // console.log( "ready!" );

  // 
  // SLICK CAROUSEL
  // 
  // Count carousel instances on page (items with class .work-gallery)
  // Add a unique ID to each carousel
  const carouselCount = $('.work-gallery').length;

  // Slick Carousel Configuration

  const slickSettings = {
    // autoplay: true,
    // autoplaySpeed: 2000,
    lazyLoad: 'progressive',
    slidesToShow: 1,
    slidesToScroll: 1,

    responsive: [
      {
        breakpoint: 768,
        settings: {
          autoplay: false
        }
      },
      {
        breakpoint: 600,
        settings: {
          arrows: true,
          slidesToShow: 1,
          slidesToScroll: 1
        }
      },
      {
        breakpoint: 480,
        settings: {
          autoplay: true,
          autoplaySpeed: 2000,
          arrows: false,
          slidesToShow: 1,
          slidesToScroll: 1
        }
      }
    ]
  };

  // Activate every carousel on the page
  for (i = 1; i <= carouselCount; i++){
    $('#gallery_' + i).slick(slickSettings);
  }

  // 
  // Medium Zoom
  // 
  const mediumZoomSettings = {
    background: '#333',
    margin: 24
  }
  mediumZoom('.gallery-item img', mediumZoomSettings);
});
