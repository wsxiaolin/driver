# 不想起标题

这是一个用于处理 Web 应用程序中导航步骤的库。它允许您基于提供的配置创建驱动程序实例，并轻松地浏览不同页面。

用的driver.js库是一个**旧版本**，[文档](http://driver.employleague.cn/guide/#%E7%AE%80%E4%BB%8B%E5%8F%8A%E4%BD%BF%E7%94%A8%E6%95%99%E7%A8%8B)


**做这个仓库只是给紫大看看能不能实装，配置文件啥的都还没写，只是想看个确定答复：这东西能不能用？能用到话我继续下一步**

## 新的问题
按照我的设想，导航其实应该在在用户登录后在开启？（比如：创界帖子，引导修改头像等）这一部分我还没确定

## 移动端适配
核心逻辑：在出现需要的元素没有出现的时候，点击对应按钮使他出现。
配置文件："hopeElement": "#hope" //需要的元素
        "nextClick" : "#test"  //没有元素点击这里

## 谷歌统计事件上报

位于index.js内的driverReport函数之内，紫大麻烦**注册一下事件，引入JS文件，和找个地方写一下`gtag('config', 'GA_MEASUREMENT_ID')`**，目前这个代码会用到：

eventName统一为：driver  

event_label有三个：
- Automatic Start
- Manual Start
- Closed


## 先看看这个

1，main.js 把第218行的路径修改为配置文件的路径就行。  
不过这里有一个问题，语言文件是固定的（zh-CN.json），多语言支持默认为：`const userLanguage = I18n.locale`; 就行）会返回用户设置的语言

![](/pic/Screenshot_20240316_095631.jpg)

2，src下的min.js和min.css可以不加入插件，这个是下载下来的库，不加入通过cdn引入，加入的话修改这几行，把本地路径放在数组的第一项。

![](/pic/Screenshot_20240316_100231.jpg)

3，插件只需要全局注入js脚本就行，可以写一个插件文件夹再上传到Discourse插件列表，目录咋写文档里大概有，也交给紫大啦，这是一个例子：

```
driver-custom-plugin/
│
├── assets/
│   └── javascripts/
│       └── main.js     # 主要的 JavaScript 文件
│
├── json/                    # 存放 JSON 文件的文件夹
│   ├── file1.json
│   ├── file2.json
│   ├── file3.json
│   └── ...
│
├── plugin.rb                # 插件的主要配置文件
```

4，plugin.rb 紫大应该比我熟，简单的可以这么写：

```
# name: driver-custom-plugin
# version: 0.1
# authors: []

register_asset 'javascripts/main.js', :server_side
register_asset 'json/file1.json', :server_side //这个不知道需不需要
register_asset 'json/file2.json', :server_side
register_asset 'json/file3.json', :server_side
```
## 配置

配置信息位于getJsonFilePath函数内，baseurl是插件路径，如果不改别的的话默认值就是安装路径+插件名，改了的话可以在rb里面传入，或者考虑用那种既可以写js又可以写rb的文件（不了解，听说可以）

配置对象包括以下属性：

- `forceStartSelectors`：此属性用于绑定强制重新启动导航的按钮。它将路径映射到它们各自的选择器。默认为`#navStart`

- `pagelist`：此属性将页面路径绑定到导航名称。多个页面可以与同一导航关联。

- `initConfig`：此属性配置导航步骤。可用选项如下：
   - `className`：用于 driver.js 弹出窗口的额外 CSS 类名。
   - `animate`：在更改突出显示的元素时是否使用动画。
   - `opacity`：覆盖层的背景透明度（0 表示仅弹出窗口而没有覆盖层）。
   - `padding`：突出显示的元素与边缘之间的距离。
   - `allowClose`：单击覆盖层是否应关闭覆盖层。
   - `overlayClickNext`：单击覆盖层是否移动到下一步。
   - `doneBtnText`：最终按钮上的文本。
   - `closeBtnText`：每个步骤的关闭按钮上的文本。
   - `nextBtnText`：每个步骤的下一个按钮上的文本。
   - `prevBtnText`：每个步骤的上一个按钮上的文本。
   - `showButtons`：是否在页脚中显示控制按钮。
   - `keyboardControl`：是否允许通过键盘进行控制（例如，使用 Escape 键关闭或箭头键移动）。
   - `scrollIntoViewOptions`：传递给 `scrollIntoView()` 方法的选项。
   - `onHighlightStarted`：要突出显示元素时调用的回调函数。
   - `onHighlighted`：当元素完全突出显示时调用的回调函数。
   - `onDeselected`：当元素已取消选择时调用的回调函数。
   - `onReset`：当准备清除覆盖层时调用的回调函数。
   - `onNext`：移动到下一步时调用的回调函数。
   - `onPrevious`：移动到上一步时调用的回调函数。

- `pageDriversMap`：此对象表示每个导航的步骤。键是导航名称，值是步骤数组。每个步骤被定义为具有以下属性的 JSON 对象：
```
{
  element: '#some-item',        // Query selector string or Node to be highlighted 高亮节点选择器
  popover: {                    // There will be no popover if empty or not given 弹窗选项
    className: 'popover-class', // className to wrap this specific step popover in addition to the general className in Driver options 弹窗额外class名
    title: 'Title',             // Title on the popover 标题
    description: 'Description', // Body of the popover 内容
    showButtons: false,         // Do not show control buttons in footer 是否显示按钮
    closeBtnText: 'Close',      // Text on the close button for this step 关闭按钮文字
    nextBtnText: 'Next',        // Next button text for this step 下一步按钮文字
    prevBtnText: 'Previous',    // Previous button text for this step 上一步按钮文字
  }
}
```

代码中包含了两个类：`Loader` 和 `TutorialDriver`，以及一个在文档加载完成后执行的初始化脚本。下面是对这段代码的详细文档注释补充。

### 类 `Loader`

此类提供了静态方法来异步加载CSS和JS资源。它设计为不需要实例化，因此其构造函数会直接抛出错误。

#### 方法

- `loadCSS(hrefs)`
  - **参数**：`hrefs`（`string[]`）- CSS文件的URL数组。
  - **返回值**：`Promise<void>` - 加载成功时解决的Promise。
  - **功能**：异步加载CSS文件，支持带有备用链接的数组。当主链接加载失败时，尝试加载下一个链接。如果所有CSS文件都无法加载，则抛出错误。

- `loadJS(srcArray)`
  - **参数**：`srcArray`（`string[]`）- JS文件的URL数组。
  - **返回值**：`Promise<void>` - 加载成功时解决的Promise。
  - **功能**：异步加载JS文件，支持带有备用CDN链接的数组。当主链接加载失败时，尝试加载下一个链接。如果所有JS文件都无法加载，则抛出错误。

### 类 `TutorialDriver`

此类用于管理和启动页面上的教程引导流程。

#### 构造函数

- **参数**：`CSSLinks`, `JSLinks` - 分别为CSS和JS资源链接的数组。
- **功能**：初始化实例时不直接使用这些参数，但通过`loadResources`方法来加载这些资源。

#### 方法

- `loadResources(CSSLinks, JSLinks)`
  - **参数**：`CSSLinks`, `JSLinks` - 分别为CSS和JS资源链接的数组。
  - **功能**：调用`Loader`类的静态方法加载CSS和JS资源。

- `getPageName()`
  - **返回值**：当前页面名称，基于`config.pagelist`的映射。
  - **功能**：获取当前页面的名称，如果页面不存在于`pagelist`中，则发出警告。

- `hasViewedTutorial(pageName)`
  - **参数**：`pageName`（`string`）- 页面名称。
  - **返回值**：布尔值，表示用户是否已观看过该页面的教程。
  - **功能**：检查localStorage中是否记录了用户已观看过指定页面的教程。

- `markTutorialAsViewed(pageName)`
  - **参数**：`pageName`（`string`）- 页面名称。
  - **功能**：在localStorage中标记用户已观看过指定页面的教程。

- `initialize(path)`
  - **参数**：`path`（`string`）- 配置文件的路径。
  - **功能**：异步加载配置文件并更新实例的`config`属性。

- `start()`
  - **功能**：根据配置启动页面教程引导。如果用户尚未观看过当前页面的教程，则立即启动；否则，等待用户点击特定元素后启动。

- `startDriver()`
  - **功能**：具体执行教程引导的逻辑，包括定义步骤和启动Driver.js引导。

### 初始化脚本

在文档加载完成后，此脚本执行以下操作：

1. 定义CSS和JS资源链接。
2. 创建`TutorialDriver`实例。
3. 加载必要的CSS和JS资源。
4. 初始化`TutorialDriver`实例（加载配置文件）。
5. 启动教程引导。


