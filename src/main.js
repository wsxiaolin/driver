 /**
 * Loder 类用于加载CSS和JS文件
 */
 class Loader {
    /**
     * 创建Loader实例时抛出错误，因为Loader设计为静态方法集合，不需要实例化。
     */
    constructor() {
        throw new Error("Loader does not need to be instantiated");
    }

    /**
     * 异步加载CSS文件，支持带有备用链接的数组。当主链接加载失败时，尝试加载下一个链接。
     * @param {string[]} hrefs - CSS文件的URL数组。
     * @returns {Promise<void>} 加载成功时解决的Promise。
     * @throws {Error} 如果所有CSS文件都无法加载，则抛出错误。
     */
    static async loadCSS(hrefs) {
        for (const href of hrefs) {
            try {
                await new Promise((resolve, reject) => {
                    const link = document.createElement('link');
                    link.href = href;
                    link.rel = 'stylesheet';
                    document.head.appendChild(link);

                    link.onload = () => resolve();
                    link.onerror = () => {
                        link.remove(); // 移除无法加载的链接
                        reject(`Failed to load ${href}`);
                    };
                });
                return; // 当某个CSS文件加载成功时，终止循环
            } catch (error) {
                console.error(error);
            }
        }
        throw new Error('All CSS URLs failed to load.');
    }

    /**
     * 异步加载JS文件，支持带有备用CDN链接的数组。当主链接加载失败时，尝试加载下一个链接。
     * @param {string[]} srcArray - JS文件的URL数组。
     * @returns {Promise<void>} 加载成功时解决的Promise。
     * @throws {Error} 如果所有JS文件都无法加载，则抛出错误。
     */
    static async loadJS(srcArray) {
        for (const src of srcArray) {
            try {
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.type = 'text/javascript';
                    script.src = src;
                    document.head.appendChild(script);

                    script.onload = () => resolve();
                    script.onerror = () => {
                        script.remove(); // 移除无法加载的脚本
                        reject(`Failed to load script from ${src}`);
                    };
                });
                return; // 当某个JS文件加载成功时，终止循环
            } catch (error) {
                console.error(error);
            }
        }
        throw new Error('All JS URLs failed to load.');
    }
}


/**
 * TutorialDriver 类用于管理和驱动页面教程的展示。
 * 它能够根据页面名称加载相应的教程，检查用户是否已经观看过特定页面的教程，并在必要时启动教程引导。
 */
class TutorialDriver {
    /**
     * 创建 TutorialDriver 实例 
     */
    constructor() {
        this.config = {};
        this.cancleDriverCount = JSON.parse(localStorage.getItem('cancleDriverCount') || '{}');
        this.stepNum = 1 //正在执行的步数，从一开始
        
    }

    /**
     * 异步加载 CSS 和 JS 资源。
     * @param {Array<string>} CSSLinks - 需要加载的 CSS 文件链接数组。
     * @param {Array<string>} JSLinks - 需要加载的 JS 文件链接数组。
     */
    async loadResources(CSSLinks, JSLinks) {
        await Loader.loadCSS(CSSLinks);
        await Loader.loadJS(JSLinks);
    }

    /**
     * 获取当前页面的名称。
     * @returns {string} 返回当前页面的名称。
     */
    getPageName() {
        const pagelist = this.config.pagelist;
        if (!pagelist.hasOwnProperty(window.location.pathname))
            console.warn("no such pages in page list");
        return pagelist[window.location.pathname];
    }

    /**
     * 判断是否应当开启教程指定页面的教程。
     * @param {string} pageName - 页面名称。
     * @param {number} day - 如果用户在 day 天之内打开过教程并且关闭，则不再开启（默认为0.5天）
     * @returns {boolean} 如果应当开启，则返回 true；否则返回 false。
     */
    static shouldStartTutorial(pageName,cancleDriverCount = 0) {
        const viewedPages = JSON.parse(localStorage.getItem('viewedTutorials') || '{}');
        if (viewedPages[pageName] == undefined) return  true //没有观看记录，直接开启新导航
        if (viewedPages[pageName] == true) return false //已经看过的则关闭行为不再会影响之后的默认弹出（用户可能是已经看过的了，只是不小心误触了）
        if( (+new Date() - viewedPages[pageName]) > cancleDriverCount * cancleDriverCount * cancleDriverCount * cancleDriverCount* 60 * 60 * 1000) return true //关闭导航会写入时间戳，上一次关闭 > 指定时间（取消次数^4 小时）
        if(cancleDriverCount >= 4) return false //用户是一点也不想看教程了
        return false
        
    }

    /**
     * 标记指定页面的教程为已观看。
     * @param {string} pageName - 页面名称。
     */
    static markTutorialAsViewed(pageName) {
        const viewedPages = JSON.parse(localStorage.getItem('viewedTutorials') || '{}');
        viewedPages[pageName] = true;
        localStorage.setItem('viewedTutorials', JSON.stringify(viewedPages));
    }

    /**
     * 异步初始化配置信息。
     * @param {string} path - 配置信息的 JSON 文件路径。
     */
    async initialize(path) {
        try {
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            this.config = await response.json();
        } catch (error) {
            console.error('Failed to load config:', error);
        }
    }

    /**
     * 启动教程引导。
     * 根据当前页面自动选择启动按钮。如果用户未观看过当前页面的教程，则自动启动教程引导。
     */
    start() {
        const selector = this.config.forceStartSelectors[window.location.pathname] || "#navStart";
        if (document.querySelector(selector)) {
            document.querySelector(selector).addEventListener('click', () => {
                console.info(`${selector} has been clicked, driver started`);
                this.startDriver();
                driverReport("Automatic Start")
            });
        } else {
            console.warn(`can not found start-element: ${selector}`);
        }
        if (TutorialDriver.shouldStartTutorial(this.getPageName())) {
            this.startDriver();
            driverReport("Manual Start")
        } else {
            console.info(`page should not be start`);
        }
    }

    /**
     * 根据当前页面的名称，获取并启动对应的教程步骤。
     */
    startDriver() {
        const pageName = this.getPageName();
        // 点击下一步
        this.config.initConfig.onNext = () => {
            if(driver.hasNextStep() == false){
              // 已经完成
              TutorialDriver.markTutorialAsViewed(pageName); // 标记为已观看
            } else{
              console.log(this.config.pageDriversMap[pageName][this.stepNum-1])
              
              if (document.querySelector(this.config.pageDriversMap[pageName][this.stepNum].popover.hopeElement)) {
                // 希望中的元素出现
              } else if(this.config.pageDriversMap[pageName][this.stepNum-1].popover.hasOwnProperty("nextClick")){
                // 没出现
                try {
                document.querySelector(this.config.pageDriversMap[pageName][this.stepNum-1].popover.nextClick).click()
                } catch (e) {
                  console.log(e)
                }
              }
              this.stepNum ++ 
            }
        }
        
        // 绑定事件：关闭导航之后标记当前导航未完成，下一次访问将会开启
        this.config.initConfig.onDeselected = () => {
          if (TutorialDriver.shouldStartTutorial(this.getPageName(pageName),this.cancleDriverCount[this.getPageName(pageName)]) == true) {
            driverReport('Closed')
            // 导航没有被看过，用户首次观看的时候就关闭它了
            const viewedPages = JSON.parse(localStorage.getItem('viewedTutorials') || '{}');
            viewedPages[pageName] = +new Date();
            // 指定天数之后再次开启（在 shouldStartTutoraial传参）
            localStorage.setItem('viewedTutorials', JSON.stringify(viewedPages));
            if(this.cancleDriverCount.hasOwnProperty(this.getPageName(pageName))){
              // 多次取消：累计
              this.cancleDriverCount[this.getPageName(pageName)] += 1
            } else {
              // 第一次取消
              this.cancleDriverCount[this.getPageName(pageName)] = 1
            }
            localStorage.setItem("cancleDriverCount",JSON.stringify(this.cancleDriverCount))
            console.log(this.cancleDriverCount)
            
          }
        }
        const steps = this.config.pageDriversMap[pageName];
        const driver = new Driver(this.config.initConfig);

        if (steps) {
            driver.defineSteps(steps);
            driver.start(); // 启动引导
            this.stepNum = 1 //正在执行的步数，从一开始
            
        } else {
            console.warn(`No steps defined for page: ${pageName}`);
        }
    }
}
  
/**
 * 返回JSON文件路径
 * @param {String} baseurl - 插件路径
 * @return {String} - 文件路径
 */
function getJsonFilePath(baseurl = "/plugins/driver-custom-plugin/"){
  try {
    return `${baseurl}json/${I18n.locale}.json`
  } catch (e) {
    return `/src/json/zh_CN.json`
  }
}

/**
 * 上报事件 
 * @param {String} lable - 谷歌统计里面的那个lable
 */
function driverReport(lable){
  try {
    gtag('event', 'driver', {
      'event_label': lable
    })
  } catch (e) {
    console.log()
  }
  
}
  
/* 开始执行 */
window.addEventListener('DOMContentLoaded', async () => {
    const path = getJsonFilePath()
    console.log(`Json file path :${path}`)
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

    const tutorialDriver = await new TutorialDriver(CSSLinks, JSLinks);
    await tutorialDriver.loadResources(CSSLinks, JSLinks); // 确保资源加载完成
    await tutorialDriver.initialize(path); // 初始化配置
    tutorialDriver.start(); // 启动教程
});
