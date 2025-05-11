
const FeaturesSection = () => {
  return (
    <section className="bg-black text-white border-t-8 border-[#222] py-16 px-4">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center">
        <div className="md:w-1/2 text-center md:text-left mb-8 md:mb-0">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Enjoy on your TV.</h2>
          <p className="text-lg md:text-xl">Watch on Smart TVs, Playstation, Xbox, Chromecast, Apple TV, Blu-ray players, and more.</p>
        </div>
        <div className="md:w-1/2 relative">
          <img 
            src="https://assets.nflxext.com/ffe/siteui/acquisition/ourStory/fuji/desktop/tv.png" 
            alt="TV" 
            className="relative z-10" 
          />
          <div className="absolute top-[48%] left-[50%] transform translate-x-[-50%] translate-y-[-50%] max-w-[73%] max-h-[54%] z-0">
            <video autoPlay playsInline muted loop className="w-full h-full">
              <source src="https://assets.nflxext.com/ffe/siteui/acquisition/ourStory/fuji/desktop/video-tv-0819.m4v" type="video/mp4" />
            </video>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
