import Image from "next/image";
import { SplashExit } from "./splash-exit";
import { SPLASH_SEEN_KEY } from "./splash-key";

// Lu avant le premier affichage : si l'écran de lancement a déjà été vu pendant
// cette visite, on le cache tout de suite pour qu'il ne clignote pas. Les
// navigateurs pilotés par les tests automatiques le sautent aussi, sauf avec ?splash.
const SKIP_IF_SEEN = `try{if(sessionStorage.getItem("${SPLASH_SEEN_KEY}")||(navigator.webdriver&&!/[?&]splash\\b/.test(location.search)))document.documentElement.dataset.splash="vu"}catch(e){}`;

// Écran de lancement : sur téléphone (et dans l'application installée), le logo
// s'anime au moins cinq secondes, le temps que la barre se remplisse, une fois par visite.
export function SplashScreen() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: SKIP_IF_SEEN }} />
      <div id="miam-splash" className="splash" aria-hidden="true">
        <div className="splash-glow" />
        <div className="relative grid size-40 place-items-center">
          <span className="splash-ring" />
          <span className="splash-ring splash-ring-2" />
          <Image src="/brand/emblem.png" alt="" width={112} height={112} priority className="splash-emblem rounded-full" />
        </div>
        <p className="splash-title mt-9 font-display text-[3.25rem]">
          <span>Mon</span> <span>Miam</span> <span>Miam</span>
        </p>
        <p className="splash-tagline deco mt-3 text-accent">Sur place ou en livraison</p>
        <div className="splash-loader mt-10">
          <div className="splash-bar">
            <span className="splash-fill" />
          </div>
          <p className="splash-meta deco">
            <span>Préparation de ta table</span>
            <span className="splash-pct" />
          </p>
        </div>
      </div>
      <SplashExit />
    </>
  );
}
