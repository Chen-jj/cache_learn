## Web 应用层存储技术

### 一、cookie & session

在程序中，会话跟踪是很重要的，相当多的应用逻辑需要根据不同会话的对象来进行判断、处理。
但是在web程序中，主要的数据传输协议HTTP是无状态的，服务器无法从连接上区分会话。
cookies和session就是为了解决上述问题的会话跟踪技术。

#### 1.cookie

cookie是一小段文本信息，存储在客户端的硬盘或内存中，不同的浏览器对不同域名的cookie数量和每个cookie的大小都有不同的规定。

工作原理：

客户端请求服务器，服务器根据业务逻辑的需要（需要记录该会话对象的一些状态），在返回头上设置一个cookie。客户端将cookie保存起来。以后每当客户端访问服务器时，都会在请求头上带上该请求的url下可获取的所有cookie。然后服务器就能根据这些cookie，获取辨认用户状态。

| cookie属性 | type | 描述 |
| ------------ | ------------- | ------------ |
| name      | String  | Cookie的名称。Cookie一旦创建，名称便不可更改 |
| value    | Object  | Cookie的值。 |
| maxAge       | int  | 该Cookie失效的时间，单位秒。如果为正数，则该Cookie在maxAge秒之后失效。如果为负数，该Cookie为临时Cookie，关闭浏览器即失效，浏览器也不会以任何形式保存该Cookie。如果为0，表示删除该Cookie。默认为–1 |
| secure      | boolean  | 该Cookie是否仅被使用安全协议传输。安全协议。安全协议有HTTPS，SSL等，在网络上传输数据之前先将数据加密。默认为false |
| path         | String  | 该Cookie的使用路径。如果设置为“/sessionWeb/”，则只有contextPath为“/sessionWeb”的程序可以访问该Cookie。如果设置为“/”，则本域名下contextPath都可以访问该Cookie。注意最后一个字符必须为“/” |
| domain    | String  | 可以访问该Cookie的域名。如果设置为“.google.com”，则所有以“google.com”结尾的域名都可以访问该Cookie。注意第一个字符必须为“.” |
| comment    | String  | 该Cookie的用处说明。浏览器显示Cookie信息的时候显示该说明 |
| version    | int  | 该Cookie使用的版本号。0表示遵循Netscape的Cookie规范，1表示遵循W3C的RFC 2109规范 |

#### 2.session

session是另一种会话跟踪技术，不同于cookie将信息储存在客户端，session把信息储存在服务端。

服务端会返回一个对应该session信息的key：sessionId给浏览器，当然此sessionId的储存载体依赖于cookie（当cookie被关闭时会使用url地址重写技术）。以后每次客户端访问服务器时，都会在请求头上带上该请求的url下可获取的所有cookie，服务端解析含sessionId的cookie即可取得对应会话方的session。

很多文章都说重要信息放session，普通状态放cookie，有一定的道理。但如果sessionId被截取了，还是可以冒充对话方，进行一些私密操作，因此重要的操作必须另有加密与验证手段，当然这是另一个话题了。前端更关注的是牺牲服务端的储存空间和一些hash读取时间，把一些状态放到服务端，减少cookies的大小，可以减少请求头消耗的带宽，毕竟每个请求都会带上cookie。

### 二、LocalStorage & SessionStorage

cookie的大小、格式、存储数据格式均存在限制，但如果要在客户端存储信息，必须借助cookie。这是HTML5标准之前的现实。但cookie对于现在需求不断壮大的富状态的web app来说，是远远不够的。而HTML5标准通过支持两种WebStorage：LocalStorage 和 SessionStorage，并提供一系列操作两者的api，来破解cookie的限制。

#### 1.LocalStorage

LocalStorage是永久存储于客户端本地的数据集合，除非主动删除，否则永远不会过期。

LocalStorage的大小为5M以上，不会随着HTTP请求发送到服务端。

API：

* setItem(key,value)：添加本地存储数据。
* getItem(key):通过key获取相应的Value。
* removeItem(key):通过key删除本地数据。
* clear():清空数据。

当前可以直接把key作为LocalStorage的属性来设置：LocalStorage.x = "a";


#### 2.SessionStorage

SessionStorage只在当前会话下有效，下面为我在chrome下一些行为的测试结果：

* 关闭标签页后无效。
* 当前标签页跳转到其它url后无效。
* 当前标签页跳转到其它url后返回、前进，有效。
* 当前标签页先跳转到其它url，再输入原url，有效。
* 当前标签页，点击刷新、强制刷新，有效。
* 当前标签页，iframe内有效。

可以认为sessionStorage在当前标签页的设置此sessionStorage的url及其iframe下，均有效。

Api同LocalStorage。

LocalStorage 和 SessionStorage的出现与普及是前端程序员的福音，使很多处理手法成为可能，也让web app有了挑战原生应用的底气。

### 本地数据库 Web SQL DataBase

虽然LocalStorage & SessionStorage提供了强大的本地储存功能，但是毕竟只能存储简单的数据结构。HTML5提供了一个浏览器端的数据库支持，允许使用js的api在浏览器创建一个本地数据库，支持标准的SQL的CRUD操作，让web app可以存储那些本来储存在后台数据库里的、常用的数据，减少请求，优化效率，同时也让web app支持部分离线操作。

本地数据库在移动端支持良好，IE、Firefox、Opera则都不支持。

### 离线存储技术

离线存储允许将一些文件资源放在本地，在离线的情况下还能访问到缓存的页面，通常这些资源为html、css、js、images等，在非离线的情况下，浏览器也会优先使用已离线缓存的资源，返回200（from cache）。

工作原理：
  首先，服务端将需要离线缓存的文件名按一定规则写进一个.manifest后缀名的文件，并设置它的MIME类型为text/cache-manifest。
  需要按该离线缓存清单进行缓存的页面的html标签加入manifest属性，其值指向该.manifest文件。
  第一次访问，客户端缓储该清单内所有文件。
  以后的访问，先根据浏览器的缓存策略判断manifest文件是否有更新，如果是最新的，则使用离线缓存的文件。如果被修改了，则根据清单重新去下载指定的一系列文件（注意是manifest里所有文件都全部重新下载），然后更新离线缓存。
  
js接口对象：window.applicationCache。其含有很多浏览器处理离线存储期间的状态触发的事件，并且能主动触发离线存储更新（实际上是主动去检测manifest文件是否有更改）。

离线储存技术为web app提供了一种新颖且优秀的应用程存储策略，结合此技术实行合适的缓存策略，必将进一步提升网页性能。但是现阶段它还是有不少坑：

  * 不同浏览器对一个站点的离线缓存容量有不同限制。
  * manifest内当一个文件下载失败，则整个更新过程失败，浏览器使用旧缓存。
  * manifest更新后，其内部制定的所有文件必须全部从新下载。
  * 其它url缓存过的文件，即使之前缓存过，但是在新manifest内被指定，都需要重新下载。
  * 站点中其它页面即逝没有设置manifest属性，请求的资源如果在缓存中，也会从缓存中访问。
