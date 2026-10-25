import { SplashExit } from "./splash-exit";
import { SPLASH_SEEN_KEY } from "./splash-key";

// Lu avant le premier affichage : si l'écran de lancement a déjà été vu pendant
// cette visite, on le cache tout de suite pour qu'il ne clignote pas. Les
// navigateurs pilotés par les tests automatiques le sautent aussi, sauf avec ?splash.
const SKIP_IF_SEEN = `try{if(sessionStorage.getItem("${SPLASH_SEEN_KEY}")||(navigator.webdriver&&!/[?&]splash\\b/.test(location.search)))document.documentElement.dataset.splash="vu"}catch(e){}`;

// Photos HD libres de droits (licence Unsplash), à la largeur d'un écran de
// téléphone. Posées en fond CSS : un écran caché (ordinateur, visite déjà
// commencée) ne les télécharge pas.
const unsplash = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&h=2100&q=80`;

const SLIDES = [
  { photo: unsplash("photo-1508615263227-c5d58c1e5821"), kicker: "Fait maison", text: "Des saveurs qui racontent une histoire." },
  { photo: unsplash("photo-1618046364546-81e9d03d39a6"), kicker: "Jus frais", text: "Préparés chaque jour, servis bien frais." },
  { photo: unsplash("photo-1528605248644-14dd04022da1"), kicker: "Sur place ou livré", text: "Et des points à chaque repas." },
];

// Écran de lancement : sur téléphone (et dans l'application installée), trois
// photos se succèdent avec une phrase chacune, pendant qu'une fine barre se
// remplit tout en bas, au moins cinq secondes, une fois par visite.
export function SplashScreen() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: SKIP_IF_SEEN }} />
      <div id="miam-splash" className="splash" aria-hidden="true">
        {SLIDES.map((slide, i) => (
          <div key={slide.photo} className="splash-slide" style={{ backgroundImage: `url(${slide.photo})`, ["--i" as string]: i }} />
        ))}
        <div className="splash-shade" />
        <p className="splash-brand deco">Mon Miam Miam</p>
        <div className="splash-captions">
          {SLIDES.map((slide, i) => (
            <div key={slide.kicker} className="splash-caption" style={{ ["--i" as string]: i }}>
              <p className="deco text-accent">{slide.kicker}</p>
              <p className="mt-3 font-display text-[2.6rem] leading-[0.95]">{slide.text}</p>
            </div>
          ))}
        </div>
        <div className="splash-bar">
          <span className="splash-fill" />
        </div>
      </div>
      <SplashExit />
    </>
  );
}
