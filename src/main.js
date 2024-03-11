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
     * 创建 TutorialDriver 实例时加载指定的 CSS 和 JS 资源。
     * @param {Array<string>} CSSLinks - 需要加载的 CSS 文件链接数组。
     * @param {Array<string>} JSLinks - 需要加载的 JS 文件链接数组。
     */
    constructor(CSSLinks, JSLinks) {
        this.config = {};
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
     * 检查用户是否已经观看过指定页面的教程。
     * @param {string} pageName - 页面名称。
     * @returns {boolean} 如果用户已经观看过教程，则返回 true；否则返回 false。
     */
    static hasViewedTutorial(pageName) {
        const viewedPages = JSON.parse(localStorage.getItem('viewedTutorials') || '{}');
        return !!viewedPages[pageName];
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
            });
        } else {
            console.warn(`can not found start-element: ${selector}`);
        }
        if (!TutorialDriver.hasViewedTutorial(this.getPageName())) {
            this.startDriver();
        } else {
            console.info(`page has been already viewed`);
        }
    }

    /**
     * 根据当前页面的名称，获取并启动对应的教程步骤。
     */
    startDriver() {
        const pageName = this.getPageName();
        const steps = this.config.pageDriversMap[pageName];
        const driver = new Driver(this.config.initConfig);

        if (steps) {
            driver.defineSteps(steps);
            driver.start(); // 启动引导
            TutorialDriver.markTutorialAsViewed(pageName); // 标记为已观看
        } else {
            console.warn(`No steps defined for page: ${pageName}`);
        }
    }
}
  
/* 开始执行 */
window.addEventListener('DOMContentLoaded', async () => {
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

    const tutorialDriver = await new TutorialDriver(CSSLinks, JSLinks);
    await tutorialDriver.loadResources(CSSLinks, JSLinks); // 确保资源加载完成
    await tutorialDriver.initialize(path); // 初始化配置
    tutorialDriver.start(); // 启动教程
});
