class TutorialDriver {
    constructor(CSSLinks, JSLinks) {
        this.CSSLinks = CSSLinks;
        this.JSLinks = JSLinks;
        this.config = {};
    }
    
    static hasViewedTutorial(pageName) {
      const viewedPages = JSON.parse(localStorage.getItem('viewedTutorials') || '{}');
      return !!viewedPages[pageName];
    }

    async initialize() {
        await TutorialDriver.loadCSSWithFallback(this.CSSLinks);

        TutorialDriver.tryLoadScriptFromCDNs(this.JSLinks, () => {
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

    static loadCSSWithFallback(hrefs) {
      const tryLoadCSS = (href) => new Promise((resolve, reject) => {
        const link = document.createElement('link');
        link.href = href;
        link.rel = 'stylesheet';
    
        const timeoutId = setTimeout(() => {
          reject(`Timeout: Failed to load ${href} within 3 seconds`);
          link.remove(); // 取消加载超时资源
        }, 3000);
    
        link.onload = () => {
          clearTimeout(timeoutId);
          resolve(href);
        };
    
        link.onerror = () => {
          clearTimeout(timeoutId);
          reject(`Failed to load ${href}`);
          link.remove(); // 加载失败时也需要移除元素
        };
    
        document.head.appendChild(link);
      });
    
      const loadSequentially = async (index) => {
        if (index >= hrefs.length) {
          return Promise.reject('All URLs failed to load.');
        }
    
        try {
          return await Promise.race([tryLoadCSS(hrefs[index]), new Promise(resolve => setTimeout(resolve, 3000))]);
        } catch (error) {
          console.error(error);
          return loadSequentially(index + 1);
        }
      };
    
      return loadSequentially(0);
    }
    
    static tryLoadScriptFromCDNs(JSLinks, onSuccess) {
      if (JSLinks.length === 0) {
        console.error('All CDNs failed to load the script.');
        return;
      }
    
      const currentCDN = JSLinks.shift();
      TutorialDriver.loadScript(currentCDN, onSuccess, () => {
        setTimeout(() => TutorialDriver.tryLoadScriptFromCDNs(JSLinks, onSuccess), 3000); // 等待3秒后继续加载下一个资源
      });
    }

    static loadScript(src, onSuccess, onError) {
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

    startDriverForPage() {
        return (pageName) => {
              if (!TutorialDriver.hasViewedTutorial(pageName)) {
                const steps = this.config.pageDriversMap[pageName];
                if (steps) {
                  const createAndStartDriver = TutorialDriver.createDriver(this.config.initConfig);
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
        if (!pagelist.hasOwnProperty(window.location.pathname)) console.warn("no such pages in page list")
        return pagelist[window.location.pathname]
    }

    static compulsoryDriver(config) {
        const currentPageName = TutorialDriver.getPageName(config.pagelist);
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
    initializeApp() {
        // 基于加载的配置执行初始化操作
        TutorialDriver.loadCSSWithFallback(this.CSSLinks)
            .then(() => console.info('CSS loaded successfully.'))
            .catch(() => console.info('Failed to load any of the CSS files'));

        TutorialDriver.tryLoadScriptFromCDNs(this.JSLinks, () => {
            console.info('Script loaded successfully');
            if (document.querySelector("#navStart")) document.querySelector("#navStart").style.display = "block";
            const startDriver = this.startDriverForPage(this.config.initConfig);
            const currentPageName = TutorialDriver.getPageName(this.config.pagelist);
            startDriver(currentPageName);
            console.info("driver started successfully");
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
    
    start(path) {
      this.loadConfigAndInitialize(path)
    }

}

/* 开始执行 */
window.addEventListener('DOMContentLoaded', (event) => {
  const path = "../src/config/zh-CN.json";
    const CSSLinks = [
        'https://cdn.bootcdn.net/ajax/libs/driver.js/0.9.8/driver.min.css',
        'https://cdnjs.cloudflare.com/ajax/libs/driver.js/0.9.8/driver.min.css',
        'https://cdn.staticfile.net/driver.js/0.9.8/driver.min.css'
    ];
    const JSLinks = [
        'https://cdn.bootcdn.net/ajax/libs/driver.js/0.9.8/driver.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/driver.js/0.9.8/driver.min.js',
        'https://cdn.staticfile.net/driver.js/0.9.8/driver.min.js'
    ];

    const tutorialDriver = new TutorialDriver(CSSLinks, JSLinks);
    tutorialDriver.start(path);
});
