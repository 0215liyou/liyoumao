/*
* @File     : mp4movie.js
* @Author   : jade
* @Date     : 2024/2/19 9:41
* @Email    : jadehh@1ive.com
* @Software : Samples
* @Desc     :
*/
import {_, load} from '../lib/cat.js';
import {VodDetail, VodShort} from "../lib/vod.js"
import * as Utils from "../lib/utils.js";
import {Spider} from "./spider.js";


class DyttSpider extends Spider {
    constructor() {
        super();
        this.siteUrl = "https://www.mp4us.com"
        this.apiUrl = "https://m.mp4us.com"
        this.dyttReconnectTimes = 0

    }

    getName() {
        return "🍚|Mp4电影|🍚"
    }

    getAppName() {
        return "Mp4电影"
    }

    // getHeader() {
    //     return {"User-Agent": Utils.CHROME, "Referer": this.siteUrl + "/","Connection":"keep-alive"};
    // }

    async getFilter() {
        let extend_list = []
        let $ = await this.getHtml()
        let suoyinElement = $("[class=\"nav navbar-nav\"]").find("li").slice(-1)[0]
        let souyinUrl = $(suoyinElement).find("a")[0].attribs.href
        let souyin$ = await this.getHtml(this.siteUrl + souyinUrl)
        let sortElements = souyin$("[class=\"sort-box\"]").find("[class=\"sort-list\"]").slice(1,-1)
        for (const sortElement of sortElements){
            let name =  $($(sortElement).find("h5")).text().replace("：","")
            let extend_dic = {"key": name, "name":name, "value": []}
            for (const ele of $(sortElement).find("a")) {
                extend_dic["value"].push({"n": $(ele).text(), "v": ele.attribs.data.split("-")[1]})
            }
            extend_list.push(extend_dic)
        }
        return extend_list
    }

    async setFilterObj() {
        for (const type_dic of this.classes) {
            let type_id = type_dic["type_id"]
            if (type_id !== "最近更新") {
                this.filterObj[type_id] = await this.getFilter()
            }
        }
    }

    async setClasses() {
        let $ = await this.getHtml()
        let suoyinElement = $("[class=\"nav navbar-nav\"]").find("li").slice(-1)[0]
        let souyinUrl = $(suoyinElement).find("a")[0].attribs.href
        let souyin$ = await this.getHtml(this.siteUrl + souyinUrl)
        let sortElements = souyin$("[class=\"sort-box\"]").find("[class=\"sort-list\"]")
        let classElements = $(sortElements[0]).find("li")
        for (const classElement of classElements) {
            let type_name = $($(classElement).find("a")).text()
            let type_id = $(classElement).find("a")[0].attribs.data.replaceAll("id-", "")
            if (type_name !== "全部") {
                this.classes.push(this.getTypeDic(type_name, type_id))
            }
        }
    }

    async parseVodShortListFromDoc($) {
        let vod_list = []
        let vodElements = $("[class=\"index_today cclear\"]").find("a")
        for (const vodElement of vodElements){
            let vodShort = new VodShort();
            vodShort.vod_name = vodElement.attribs.title
            vodShort.vod_id = vodElement.attribs.href
            vodShort.vod_pic = this.detailProxy + Utils.base64Encode(vodShort.vod_id)
            vod_list.push(vodShort)
        }
        return vod_list
    }

    async parseVodDetailFromDoc($) {
        let vodDetail = new VodDetail()
        let html = $.html()
        let detailRootElement = $("[class=\"article-header\"]")
        let detailElements = $(detailRootElement).find("p")
        let content = ""
        for (const detailElement of detailElements){
            content = content + $(detailElement).text() + "\n"
        }
        vodDetail.type_name = $($($(detailRootElement).find("[class=\"post-meta\"]")).find("span")[0]).text()
        vodDetail.vod_pic = $(detailRootElement).find("img")[0].attribs.src
        vodDetail.vod_name = Utils.getStrByRegex(/名称：(.*?)\n/,content)
        vodDetail.vod_actor = Utils.getStrByRegex(/主演：(.*?)\n/,content)
        vodDetail.vod_director = Utils.getStrByRegex(/导演：(.*?)\n/,content)
        vodDetail.vod_area = Utils.getStrByRegex(/地区：(.*?)\n/,content)
        vodDetail.vod_year = Utils.getStrByRegex(/年份：(.*?)\n/,content)
        vodDetail.vod_remarks = Utils.getStrByRegex(/更新：(.*?)\n/,content)
        let contentElement = $("[class=\"article-related info\"]").find("p")
        vodDetail.vod_content = $(contentElement).text()
        let downloadElements = $("[class=\"article-related download_url\"]")
        let vod_play_from_list = []
        let vod_play_list = []
        for (let i = 0; i < downloadElements.length; i++) {
            let playFormatElement = downloadElements[i]
            let format_name = $($(playFormatElement).find("h2")).text().replaceAll(vodDetail.vod_name,"")
            vod_play_from_list.push(format_name.replaceAll("下载","播放"))
            let vodItems = []
            for (const playUrlElement of $(downloadElements[i]).find("a")) {
                    let episodeName = $(playUrlElement).text().replaceAll("磁力链下载","").replaceAll(".mp4","")
                    let episodeUrl = playUrlElement.attribs.href
                    vodItems.push(episodeName + "$" + episodeUrl)
                }
            vod_play_list.push(vodItems.join("#"))

        }
        vodDetail.vod_play_from = vod_play_from_list.join("$$$")
        vodDetail.vod_play_url = vod_play_list.join("$$$")
        return vodDetail
    }


    async parseVodShortListFromJson(obj) {
        let vod_list = []
        let $ = load(obj["ajaxtxt"])
        let vodElements = $($("ul")).find("li");
        for (const vodElement of vodElements){
            let vodShort = new VodShort()
            vodShort.vod_pic = $(vodElement).find("img")[0].attribs["data-original"]
            vodShort.vod_name = Utils.getStrByRegex(/《(.*?)》/,$(vodElement).find("img")[0].attribs.alt)
            vodShort.vod_id = $(vodElement).find("a")[0].attribs.href
            vodShort.vod_remarks = "评分:"+ $($(vodElement).find("[class=\"rate badge\"]")).text()
            vod_list.push(vodShort)
        }
        return vod_list
    }

    async setHomeVod() {
       let $ = await this.getHtml();
       this.homeVodList = await this.parseVodShortListFromDoc($)
    }

    async setDetail(id) {
        let $ = await this.getHtml(this.siteUrl + id)
        this.vodDetail = await this.parseVodDetailFromDoc($)
        return this.vodDetail
    }

    // getCategoryHeaders(){
    //     return {
    //         "referer":"https://m.mp4us.com/sort.html",
    //         "User-Agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_5) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/100 Version/11.1.1 Safari/605.1.15",
    //         "Cookie":"__51uvsct__1xl9dbXapjKhx0YP=2;__51vcke__1xl9dbXapjKhx0YP=da4a03cb-4665-52e8-81de-c84888e1dbd3;__51vuft__1xl9dbXapjKhx0YP=1708311891666;__vtins__1xl9dbXapjKhx0YP=%7B%22sid%22%3A%20%2235366c92-2e3a-5298-a169-649d3579ede2%22%2C%20%22vd%22%3A%201%2C%20%22stt%22%3A%200%2C%20%22dr%22%3A%200%2C%20%22expires%22%3A%201708321986921%2C%20%22ct%22%3A%201708320186921%7D"}
    // }

    async setCategory(tid, pg, filter, extend) {
        let url = this.apiUrl + `/list-index-id-${tid}`
        let area = extend["地区"] ?? ""
        let year = extend["年代"] ?? ""
        let tag = extend["标签"] ?? ""
        if (parseInt(pg) > 1){
            url = url + `-p-${pg}`
        }
        if (!_.isEmpty(area) && area !== "0"){
            url = url + `-area-${area}`
        }
        if (!_.isEmpty(year) && year !== "0"){
            url = url + `-year-${year}`
        }
        if (!_.isEmpty(tag) && tag !== "0"){
            url = url + `-wd-${tag}`
        }
        let resp = await this.fetch(url + ".html",null,this.getHeader())
        this.vodList = await this.parseVodShortListFromJson(JSON.parse(resp))
    }

}

let spider = new DyttSpider()

async function init(cfg) {
    await spider.init(cfg)
}

async function home(filter) {
    return await spider.home(filter)
}

async function homeVod() {
    return await spider.homeVod()
}

async function category(tid, pg, filter, extend) {
    return await spider.category(tid, pg, filter, extend)
}

async function detail(id) {
    return await spider.detail(id)
}

async function play(flag, id, flags) {
    return await spider.play(flag, id, flags)
}

async function search(wd, quick) {
    return await spider.search(wd, quick)
}

async function proxy(segments, headers) {
    return await spider.proxy(segments, headers)
}


export function __jsEvalReturn() {
    return {
        init: init,
        home: home,
        homeVod: homeVod,
        category: category,
        detail: detail,
        play: play,
        proxy: proxy,
        search: search,
    };
}
