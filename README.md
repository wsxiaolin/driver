# 不想起标题

这是一个用于处理 Web 应用程序中导航步骤的库。它允许您基于提供的配置创建驱动程序实例，并轻松地浏览不同页面。

用的driver.js库是一个**旧版本**，[文档](http://driver.employleague.cn/guide/#%E7%AE%80%E4%BB%8B%E5%8F%8A%E4%BD%BF%E7%94%A8%E6%95%99%E7%A8%8B)


## 开始执行：
```
window.addEventListener('DOMContentLoaded', (event) => {
  const path = "path/to/JSONfile";
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
```
## 执行步骤

1. 基于配置创建`driver`实例对象 。
2. `pagelist` 对象将页面路径绑定到导航名称。键表示路径，值表示相应的导航名称。导航名称应与`pageDriversMap` 对象中定义的步骤匹配。
3. 检查当前页面是否已导航。如果没有，则打开导航并添加指示已查看的标志。
4. 绑定事件：单击特定按钮将强制触发导航。

## 配置

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
```{
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
}```

## 语言支持

语言检测由 AI 处理，因此它可以适应不同的编程语言。