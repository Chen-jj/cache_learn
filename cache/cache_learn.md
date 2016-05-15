## 客户端浏览器缓存
### Overview
现代浏览器大多会通过在用户电脑上开辟一处硬盘空间用于储存最近请求过的文档，当用户再次访问同一个地址时，浏览器会根据一定的规则从用户本地读取之前缓存的文档代替再次从服务器获取。

浏览器缓存的好处：

1. 更快地显示请求内容
2. 减少网络带宽消耗

### 缓存如何工作

所有浏览器缓存都有一套规则来决定何时使用缓存的文档副本（当该文档有副本可用的情况下）。一些规则在HTTP协议1.0和1.1中有定义，[rfc2616](http://www.ietf.org/rfc/rfc2616.txt);一些规则则是由浏览器的用户或代理服务器的管理员设置。

### 如何控制缓存

#### 1.html的meta标签

**通过meta标签来设置缓存规则一般没什么卵用，因为只有少数几种浏览器会遵循这个标记，而在代理缓存服务器上更加不会遵循这个标记，因为它们基本不解析文档中的HTML内容**

###### Expires(期限)

设定网页的到期时间,一旦网页过期，必须到服务器上重新传输:

```
<meta http-equiv="expires"content="Fri,12Jan200118:18:18GMT"> 
```

###### Pragma(cache模式)

通常取值为private、no-cache、max-age、must-revalidate等，默认为private。

```
<meta http-equiv="Pragma"content="no-cache">
```
#### 2.HTTP头信息
##### Expires头
Expires头是HTTP1.0协议定义的、服务器端响应头的一个字段，用于告诉客户端浏览器此文档缓存数据在过期时间前可直接使用，而不需向服务端发送请求。

Expires 返回的到期时间是服务器端的UTC格式的格林威治时间（GMT），这样存在一个问题，如果客户端的时间与服务器的时间相差很大（比如时钟不同步，或者跨时区），那么误差就很大。

##### Cache-Control头
HTTP 1.1定义了另外一组头信息属性：Cache-Control响应头字段，让网站的管理员可以更全面的控制他们缓存策略的。

常用的属性：

* max-age=[秒] — 执行缓存被认为是最新的最长时间。类似于过期时间，这个参数是基于请求时间的相对时间间隔，而不是绝对过期时间，[秒]是一个数字，单位是秒：从请求时间开始到过期时间之间的秒数。
* no-cache — 强制每次请求直接发送给源服务器，而不经过本地缓存版本的校验。这对于需要确认认证应用很有用（可以和public结合使用），或者严格要求使用最新数据的应用。
* no-store — 强制缓存在任何情况下都不要保留任何副本。
* public — 标记认证内容也可以被缓存，一般来说： 经过HTTP认证才能访问的内容，输出是自动不可以缓存的；
* Private指示对于单个用户的整个或部分响应消息，不能被共享缓存处理。这允许服务器仅仅描述当用户的部分响应消息，此响应消息对于其他用户的请求无效。
* min-fresh指示客户机可以接收响应时间小于当前时间加上指定时间的响应。
* max-stale指示客户机可以接收超出超时期间的响应消息。如果指定max-stale消息的值，那么客户机可以接收超出超时期指定值之内的响应消息。
* must-revalidate — 告诉缓存必须遵循所有你给予副本的新鲜度的，HTTP允许缓存在某些特定情况下返回过期数据，指定了这个属性，你高速缓存，你希望严格的遵循你的规则。

##### Last-Modified/If-Modified-Since

两者都为HTTP1.0定义，两者配合使用的缓存策略称为协商缓存。

Last-Modified：服务器端响应头字段，告诉客户端此文档最后修改时间（格林威治时间）。

If-Modified-Since：当缓存资源过期时，浏览器取出缓存资源的Last-Modified属性，作为请求头的If-Modified-Since字段，发送到服务器。

##### Etag/If-None-Match

两者都为HTTP1.1定义，两者配合使用也是协商缓存的策略。

Etag：web服务器响应请求时，告诉浏览器当前资源在服务器的唯一标识（生成规则由服务器决定）。

If-None-Match：当缓存资源过期时，浏览器取出缓存资源的Etag属性，作为请求头的If-None-Match字段，发送到服务器。

Etag根据生成规则不同，有弱tag和强tag之分，弱tag可能是根据文档大小、最后修改时间等属性来hash，而强tag则根据文档内容来hash。

HTTP1.1中Etag的出现主要是为了解决几个Last-Modified比较难解决的问题：
*  Last-Modified标注的最后修改只能精确到秒级，如果某些文件在1秒钟以内，被修改多次的话，它将不能准确标注文件的修改时间。
*  如果某些文件会被定期生成，当有时内容并没有任何变化，但Last-Modified却改变了，导致文件没法使用缓存。
*  有可能存在服务器没有准确获取文件修改时间，或者与代理服务器时间不一致等情形。

### 浏览器缓存机制
#### 三层
##### 1.200状态

当浏览器本地没有缓存，或下一层失效，或用户强制刷新（ctrl+f5、command+shift+R）时，浏览器直接去服务器下载最新数据

##### 2.304状态（协商缓存）

此层由Last-Modified/If-Modified-Since和Etag/If-None-Match控制。当下一层失效，或用户点击刷新（f5、command+R）时，浏览器就会发送请求给服务器，如果文件没变化（对比Last-Modified和If-Modified-Since、Etag和If-None-Match），则返回304给浏览器。

##### 3.200状态（frome cache）本地缓存
由Expires和Cache-Control控制，只要没过期，浏览器只访问自身缓存。

#### 过程
* 用户通过浏览器访问页面A
* 服务器返回页面A，并给A加上Last-Modified/Etag;Cache-Control/Expires
* 客户端展示页面A，并将页面与Last-Modified/Etag;Cache-Control/Expires一起缓存
* 客户端再次请求页面A
* Cache-Control:max-age,Expires(作用会被前者完全覆盖)过期？
	* 还没过期：直接使用缓存
	* 过期：发送HTTP请求，连同If-Modified-Since（缓存的Last-Modified）和If-None-Match（缓存的Etag）一起发送给服务器，服务器检查请求的文件，没有改变则返回响应304和一个空的响应体，浏览器使用自身缓存。
	
#### 用户行为
| 用户操作 | Expires/Cache-Control | Last-Modified/Etag |
| ------------ | ------------- | ------------ |
| 地址栏回车      | 有效  | 有效 |
| 页面链接跳转    | 有效  | 有效 |
| 新开窗口       | 有效  | 有效 |
| 前进、后退      | 有效  | 有效 |
| F5刷新         | 无效  | 有效 |
| Ctrl+F5刷新    | 无效  | 无效 |


### 上面的都是别人的文章，我加以归纳
### 以下则是我的一些实践吧

我用node搭了个demo，html引用了一个css资源和一个image，html如下：

```
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<title>index</title>
	<link rel='stylesheet' type='text/css' href='./css/index.css' />
</head>
<body>
	<h1>Hello World</h1>
	<div>
		<img src="./images/aotu.jpeg" alt="">
	</div>
</body>
</html>
```

#### 1.服务器端没有设置HTTP缓存控制头

![image](https://github.com/Chen-jj/cache_learn/blob/master/cache%2Fassets%2Fimages%2Fno-cache.png)
由chrome的timeline可见浏览器先抓来了index.html,然后分别再次向服务器请求index.css和aotu.jpeg

此时服务端返回信息只设置了200状态码和ContentType，可见响应头只有几个必要信息：

```
Connection:keep-alive
ContentType:text/html
Date:Sun, 17 Apr 2016 08:53:35 GMT
Transfer-Encoding:chunked
```

同时请求头也是很简单，只有一个字段和缓存相关：

```
Cache-Control: max-age=0
```

#### 2.设置Expires
在服务器设置了2分钟的过期时间，响应头多了Expires。

```
Expires: Sun, 17 Apr 2016 14:39:05 GMT
Date: Sun, 17 Apr 2016 14:37:05 GMT
```
这里虽然看了很多文章，都说除了f5和ctrl＋f5会跳过expires控制的缓存外，其它情况下都是有效的，但这里实践了一下发现有点不同。

###### 在当前地址/index.html的地址栏回车访问/index.html

index.html的请求头会带有`Cache-Control:max-age=0`字段，意即不管本地缓存文档过期没有，都去服务器询问一次。

###### 新建标签页访问、在其它页面的地址栏回车访问

所有设置了expires头的文档这时在有效时间内都是直接读取缓存：
![image](https://github.com/Chen-jj/cache_learn/blob/master/cache%2Fassets%2Fimages%2Fexpires_1.png)

#### 3.设置Cache-Control

###### max-age:

当Cache-Control和Expires同时存在时，**完全**忽略Expires的设置（当然除了不支持Cache-Control的浏览器，这时采用Expires）。

### 强势插入：百度首页十分牛逼，刷新和强制刷新两种方式下，一些静态文件都是直接读取缓存（from cache），暂时不知道原因。

###### no-cache:

服务端返回头设置了no-cache,不再对本地是否有缓存、缓存是否过期进行判断，往后客户端每次请求都会直接访问服务端。

使用no-cache还会协商缓存。
但是Chrome浏览器前进后退都是直接使用缓存。

###### no-store:

根据http1.1文档rfc2616里的描述：

```
	The no-store directive applies to the entire message, and MAY be sent either in a response or in a request. If sent in a request, a cache MUST NOT store any part of either this request or any response to it. If sent in a response, a cache MUST NOT store any part of either this response or the request that elicited it.
```
大概意思为no-store值可以用于请求报文和响应报文，若在请求头中发送此值，一个缓存不应该存储该请求或该请求的响应；若在返回头中发送此值，一个缓存不应该存储此响应的任何部分或触发此响应的请求。

“a cache MUST NOT store any part of either this response”，这句话即是说，返回报文的头部和正文都不该被缓存，而Last-Modified和Etag是需要缓存该字段才能工作的，即是说在no-store下，应该不管是否有缓存（有可能之前的请求不是no-store而有缓存存在）、缓存是否过期，直接访问服务器，这里因为没有缓存过往的响应头信息，因此If-Modified-Since、If-None-Match不会被加上请求头，服务器应该返回200。

使用no-store不会协商缓存。
no-store可以解决前进后退访问缓存的问题。

###### public、private

查阅了很多资料，这两个值应该是关于代理服务器是不是为所有用户缓存数据。

#### 4.设置Last-Modified

用户第1次访问，返回头出现`Last-Modified`字段，浏览器缓存纪录下此文档的Last-Modified字段信息。

```
Last-Modified: Sun, 17 Apr 2016 17:37:01 GMT
```

用户第n＋1次访问，浏览器读取之前缓存的Last-Modified字段信息，加在请求头的`If-Modified-Since`字段上：

```
If-Modified-Since: Sun, 17 Apr 2016 17:37:01 GMT
```

此时服务器判断文件在此段时间内无被修改过，返回状态码304与状态信息No Modified，返回体不携带信息。
![image](https://github.com/Chen-jj/cache_learn/blob/master/cache%2Fassets%2Fimages%2Fno-modified_1.png)
可以看到此时传输数据大小都为89B，即返回头，返回体为空。

当文档被修改后，用户再去访问，则会抛弃缓存去下载最新的数据，接下来的处理就好像第一次访问一样。

f5（command+R）、刷新按钮、地址栏回车、前进后退、超链接都遵循Last-Modified规则。
ctrl+f5（command+shift+R）则不会遵循此规则，直接从服务器下载文档。

#### 5.设置Etag
与Last-Modified/If-Modified-Since相似地：

用户第1次访问，返回头出现`Etag`字段，浏览器缓存纪录下此文档的Etag字段信息。(此处我设置的是一个弱tag)

```
Etag: W/"fd-154492f8278"
```

用户第n＋1次访问，浏览器读取之前缓存的Etag字段信息，加在请求头的`If-None-Match`字段上：

```
If-None-Match: W/"fd-154492f8278
```

之前还对Etag和Last-Modified的优先级有过疑虑，但现在自己写了一下服务端的协商缓存逻辑才明白了这两者的处理逻辑是由服务端决定的。服务端编程人员可以按照自己应用的特点对这两者进行组合、放弃等。

#####Etag能解决Last-Modified的一些痛点：

1. 一些文件也许会周期性的更改，但是他的内容并不改变(仅仅改变的修改时间)，这个时候我们并不希望客户端认为这个文件被修改了，而重新GET;
2.  某些文件修改非常频繁，比如在秒以下的时间内进行修改，(比方说1s内修改了N次)，If-Modified-Since能检查到的粒度是s级的，这种修改无法判断(或者说UNIX记录MTIME只能精确到秒);
3.  有可能存在服务器没有准确获取文件修改时间，或者与代理服务器时间不一致等情形。

##### ETag带来的问题

ETag的问题在于通常使用某些属性来对它进行hash构造，有些属性对于特定的部署了网站的服务器来说是唯一的（如Aphache的innode（文件的索引节点值））。当使用集群服务器的时候，浏览器从一台服务器上获取了原始组件，之后又向另外一台不同的服务器发起条件GET请求，ETag就会出现不匹配的状况。

有一些场景下，文件最后修改时间已经足够，etag并不是很必要时，可以选择关闭etag，毕竟etag的生成还是挺消耗服务器资源的。

f5（command+R）、刷新按钮、地址栏回车、前进后退、超链接都遵循Etag规则。
ctrl+f5（command+shift+R）则不会遵循此规则，直接从服务器下载文档。

#### 一些疑问
##### 1.服务器返回304 No Modified时，Cache-Control和Expires如何处理，是否Cache-Control和Expires过期后一定要协商缓存？

这个问题主要看服务端的逻辑，我一开始在返回304时并没有再设置Cache-Control和Expires头，这样以后用户再怎样请求都不会直接使用缓存，而是走协商缓存的路。

但是当服务端在返回304的同时设置了Cache-Control和Expires头，则将重新计算此缓存有效时间，在有效期内都是直接使用本地缓存而不发送请求。

##### 2.Ajax缓存

Ajax请求的缓存策略同样是由服务端决定的，取决于服务端的返回头缓存控制字段信息。但是前端也有方法令到Ajax缓存失效，如请求头设置Cache-Control:no-cache;或设置错误的If-Modified-Since 、If-None-Match等。

##### 3.url后加查询字符串

url后加查询字符串，就是?后的参数，当然可以是格式正确(?v=123)或非正确的查询字符串(?123)，只要和此参数和上一次请求时的参数不一样，浏览器就会认为是不同的请求，不会直接使用本地缓存，而是向服务器请求一遍。

这些url后的参数一般是一些时间戳、随机数或hash值。

##### 5.强制from-cache问题

前面提到过百度pc端首页无论是强制刷新还是普通刷新，绝大部分静态资源都是200（from cache）直接使用缓存的状态，其实不止百度，天猫、淘宝都有一些静态资源采取的同样的手法。

经实践，有一种方法可以实现，就是在window.onload这个回调函数里用setTimeout的方法，动态加载资源（利用ajax或为资源添加url），同时服务端为此资源配置一个长期的max-age，就能实现这种效果。

但是百度首页并不止有这种手法，一些基本图片和jquery都是直接html里引用的，但是还是会一直使用缓存，这种现象有待继续研究。

##### 6.部署

在大公司里，会有先上线html还是先上线css的问题。

传统做法，样式表写在head标签里，js写在body标签末尾，同时用更新html里对应资源的查询字符串（可能是时间戳、也可能是版本号或文件hash值）的方法去让缓存失效，从而完成新版本的发布。但是对于大公司来说，两者部署时的时间差距内会有不良效果，这也是它们不能接受的。

先上html、再上样式：
两者部署间隔时间内，用户访问新的html文件，里面某些资源的查询字符串变了，这时浏览器放弃本地的缓存，直接请求服务器，但这时css还没部署成功，服务器返回旧的样式，并把旧样式缓存起来，这时用户会看到错乱样式的页面（新结构用旧样式），除非用户手动刷新，否则在该css缓存过期前，页面一直样式错乱。

先上样式、再上html：
两者部署间隔时间内，旧用户访问，由于该用户有该样式的缓存，因此展示正常。但是一旦有新用户访问，他将会看到一个错乱的页面（旧结构用新样式），当html上线成功时，该新用户的页面则恢复正常了。

先看看大公司们的解决方案：

百度，是采取非覆盖式发布，每次更新都会产生一个新文件，文件命名大概类似于`jquery-1.10.2.min_f2fb5194.js`，用资源名＋文件hash值来命名。

天猫、淘宝，类似的也是采取非覆盖式发布，只是把同名文件放在对应版本号的文件夹下，路径类似于`g.alicdn.com/??mui/global/3.0.15/global.css`。

京东pc端，感觉类似于前者。

京东移动版，使用覆盖式发布，以时间戳的改变来更新。

覆盖式发布是否就一定会出现一开始所说的两个问题呢，通过引入shtml，问题好像得到了一定的解决。

在服务端返回html前，会首先把shtml的内容加到html里，然后返回给浏览器。

这样shtml里是一个combo样式文件链接，带有时间戳。每次服务器都会把这条link加到html里然后返回给用户。

现在再重新看回一开始的问题：

先上结构，再上shtml（假设上shtml前样式已生效）：
shtml时间戳没变，有缓存并且缓存没过期的用户，还是使用之前的缓存，页面显示错乱（新结构用旧样式）。没有缓存的新用户，会访问到旧的样式并缓存下来，导致页面错乱（新结构用旧样式）。当shtml上线时，用户再次访问此url，因为shtml里的时间戳变了，浏览器直接访问服务器，得到新样式并缓存下来，这时页面就正常了。

先上shtml，再上结构：
用户访问url，因为shtml里时间戳变了，浏览器直接访问服务端，得到新样式，这时会页面显示错乱（旧结构用新样式）。当html上线后，页面才会显示正常。

由此可见虽然副作用不大，但还是会在间隔时间内页面错乱，一种处理办法是更新时用新的结构对应新的样式，但是这并不可能所有需求都做到，因此还是非覆盖式发布会更好一些。





















