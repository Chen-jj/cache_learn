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
* no-cache — 强制每次请求直接发送给源服务器，而不经过本地缓存版本的校验。这对于需要确认认证应用很有用（可以和public结合使用），或者严格要求使用最新数据的应用。（协商缓存还是可用的？）
* no-store — 强制缓存在任何情况下都不要保留任何副本。（协商缓存不可用？）
* public — 标记认证内容也可以被缓存，一般来说： 经过HTTP认证才能访问的内容，输出是自动不可以缓存的；（待测试）
* Private指示对于单个用户的整个或部分响应消息，不能被共享缓存处理。这允许服务器仅仅描述当用户的部分响应消息，此响应消息对于其他用户的请求无效。（待测试）
* min-fresh指示客户机可以接收响应时间小于当前时间加上指定时间的响应。（待测试）
* max-stale指示客户机可以接收超出超时期间的响应消息。如果指定max-stale消息的值，那么客户机可以接收超出超时期指定值之内的响应消息。（待测试）
* must-revalidate — 告诉缓存必须遵循所有你给予副本的新鲜度的，HTTP允许缓存在某些特定情况下返回过期数据，指定了这个属性，你高速缓存，你希望严格的遵循你的规则。（待测试）

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

![image](file:////Users/Cjj/Downloads/cache_learn/no-cache.png)
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
![image](file:////Users/Cjj/Downloads/cache_learn/expires_1.png)

#### 3.设置Cache-Control

###### max-age:

当Cache-Control和Expires同时存在时，**完全**忽略Expires的设置（当然除了不支持Cache-Control的浏览器，这时采用Expires）。

### 强势插入：百度首页十分牛逼，刷新和强制刷新两种方式下，一些静态文件都是直接读取缓存（from cache），暂时不知道原因。

#### 4.设置Last-Modified

用户第1次访问，返回头出现`Last-Modified`字段，浏览器缓存纪录下此文档的Last-Modified字段信息。

```
Last-Modified: Sun, 17 Apr 2016 17:37:01 GMT
```

用户第n＋1次访问，浏览器读取之前缓存的Last-Modified字段信息，加在请求头的`if-modified-since`字段上：

```
If-Modified-Since: Sun, 17 Apr 2016 17:37:01 GMT
```

此时服务器判断文件在此段时间内无被修改过，返回状态码304与状态信息No Modified，返回体不携带信息。
![image](file:////Users/Cjj/Downloads/cache_learn/no-modified_1.png)
可以看到此时传输数据大小都为89B，即返回头，返回体为空。

当文档被修改后，用户再去访问，则会抛弃缓存去下载最新的数据，接下来的处理就好像第一次访问一样。

f5（command+R）、刷新按钮、地址栏回车、前进后退、超链接都遵循Last-Modified规则。
ctrl+f5（command+shift+R）则不会遵循此规则，直接从服务器下载文档。

#### 5.设置Etag


























