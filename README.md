# nes模拟器（JS版）

由于只实现了3个主流的mapper，该模拟器并不能保证所有的rom都可以正常运行。

## 编译
安装依赖后，执行 npm run dev或者npm run production
```
  $ npm run dev
```

## 运行
默认运行在8080端口，可能会变化
dev访问http://localhost:8080/gui.html
production访问http://localhost:8080/production/gui.html

## 其他
在线演示系统：https://open.hoyt-tian.com/nes/gui.html
技术细节：https://www.hoyt-tian.com/tag/nes/

## 鸣谢
PPU和APU的实现，参考了Takahiro的项目https://github.com/takahirox/nes-js
