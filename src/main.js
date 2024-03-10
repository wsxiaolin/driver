class TutorialDriver {
    constructor(cdnLinksCSS, cdnLinks) {
        this.cdnLinksCSS = cdnLinksCSS;
        this.cdnLinks = cdnLinks;
    }
    
    hasViewedTutorial(pageName) {
      const viewedPages = JSON.parse(localStorage.getItem('viewedTutorials') || '{}');
      return !!viewedPages[pageName];
    }

    async initialize() {
        await this.loadCSSWithFallback(this.cdnLinksCSS);

        this.tryLoadScriptFromCDNs(this.cdnLinks, () => {
            const startDriver = this.startDriverForPage(this.config.initConfig);
            const currentPageName = TutorialDriver.getPageName(this.config.pagelist);
            startDriver(currentPageName);

            const selector = this.config.forceStartSelectors[window.location.pathname] || "#navStart";
            if (document.querySelector(selector)) {
                document.querySelector(selector).addEventListener('click', () => {
                    console.info(`${selector} has been clicked, driver started`);
                    TutorialDriver.compulsoryDriver(this.config);
                });
            } else {
                console.warn(`can not found start-element: ${selector}`);
            }
        });
    }

    async loadConfigAndInitialize(path) {
        try {
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            this.config = await response.json();
            this.initializeApp(this.config);
        } catch (error) {
            console.error('Failed to load config:', error);
        }
    }

    loadCSSWithFallback(hrefs) {
        const tryLoadCSS = (href) => new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.href = href;
            link.rel = 'stylesheet';

            link.onload = () => resolve(href);
            link.onerror = () => reject(`Failed to load ${href}`);

            document.head.appendChild(link);
        });

        const loadSequentially = (index) => {
            if (index >= hrefs.length) {
                return Promise.reject('All URLs failed to load.');
            }
            return tryLoadCSS(hrefs[index])
                .catch(error => {
                    console.error(error);
                    return loadSequentially(index + 1);
                });
        };

        return loadSequentially(0);
    }

    tryLoadScriptFromCDNs(cdnLinks, onSuccess) {
        if (cdnLinks.length === 0) {
            console.error('All CDNs failed to load the script.');
            return;
        }

        const currentCDN = cdnLinks.shift();
        this.loadScript(currentCDN, onSuccess, () => this.tryLoadScriptFromCDNs(cdnLinks, onSuccess));
    }

    loadScript(src, onSuccess, onError) {
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = src;
        script.onload = onSuccess;
        script.onerror = function () {
            console.error(`Failed to load script from ${src}`);
            onError();
        };
        document.head.appendChild(script);
    }

    startDriverForPage(initConfig) {
        return (pageName) => {
              if (!this.hasViewedTutorial(pageName)) {
                const steps = this.config.pageDriversMap[pageName];
                console.log(this.config.pageDriversMap)
                if (steps) {
                  const createAndStartDriver = TutorialDriver.createDriver(initConfig);
                  const driver = createAndStartDriver(steps);
                  driver.start(); // 启动引导
                  TutorialDriver.markTutorialAsViewed(pageName); // 标记为已观看
                } else {
                  console.warn(`No steps defined for page: ${pageName}`);
                }
              } else {
                console.info(`page has been alredy viewed`)
              }
        };
    }

    static getPageName(pagelist) {
        console.log(pagelist)
        if (!pagelist.hasOwnProperty(window.location.pathname)) console.log("no such pages in page list")
        return pagelist[window.location.pathname]
    }

    static compulsoryDriver(config) {
        const currentPageName = TutorialDriver.getPageName(this.config.pagelist);
        if (currentPageName) {
          const steps = config.pageDriversMap[currentPageName];
          if (steps) {
            // 即使教程已被标记为已观看，也强制创建并启动Driver实例
            const createAndStartDriver = TutorialDriver.createDriver(config.initConfig);
            const driver = createAndStartDriver(steps);
            driver.start(); 
            // markTutorialAsViewed(currentPageName); // 可选择是否重新标记为已观看，或者不做此操作以允许用户多次触发,如果需要，可以取消注释这行代码
          } else {
            console.warn(`No steps defined for page: ${currentPageName}`)
          }
        }
    }

    static createDriver(initConfig) {
        return function (steps) {
              const driver = new Driver(initConfig); 
              driver.defineSteps(steps); 
              return driver; 
        };
    }

    static markTutorialAsViewed(pageName) {
        const viewedPages = JSON.parse(localStorage.getItem('viewedTutorials') || '{}');
        viewedPages[pageName] = true;
        localStorage.setItem('viewedTutorials', JSON.stringify(viewedPages));
    }


    /* 开始执行 */
    initializeApp(config) {
        // 基于加载的配置执行初始化操作
        this.loadCSSWithFallback(this.cdnLinksCSS)
            .then(() => console.log('CSS loaded successfully.'))
            .catch(() => console.log('Failed to load any of the CSS files'));

        this.tryLoadScriptFromCDNs(this.cdnLinks, () => {
            console.log('Script loaded successfully');
            if (document.querySelector("#navStart")) document.querySelector("#navStart").style.display = "block";
            const startDriver = this.startDriverForPage(this.config.initConfig);
            const currentPageName = TutorialDriver.getPageName(this.config.pagelist);
            startDriver(currentPageName);
            console.log("driver started successfully");
            const selector = config.forceStartSelectors[window.location.pathname] || "#navStart";
            if (document.querySelector(selector)) {
                document.querySelector(selector).addEventListener('click', () => {
                    console.info(`${selector} has been clicked, driver started`);
                    TutorialDriver.compulsoryDriver(this.config);
                });
            } else {
                console.warn(`can not found start-element: ${selector}`);
            }
        });
    }

}

/* 开始执行 */
window.addEventListener('DOMContentLoaded', (event) => {
  const path = "";
    const cdnLinksCSS = [
        'https://cdn.bootcdn.net/ajax/libs/driver.js/0.9.8/driver.min.css',
        'https://cdnjs.cloudflare.com/ajax/libs/driver.js/0.9.8/driver.min.css',
        'https://cdn.staticfile.net/driver.js/0.9.8/driver.min.css'
    ];
    const cdnLinks = [
        'https://cdn.bootcdn.net/ajax/libs/driver.js/0.9.8/driver.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/driver.js/0.9.8/driver.min.js',
        'https://cdn.staticfile.net/driver.js/0.9.8/driver.min.js'
    ];

    const tutorialDriver = new TutorialDriver(cdnLinksCSS, cdnLinks);
    tutorialDriver.loadConfigAndInitialize(path);
});
