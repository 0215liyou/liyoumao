/*
* @File     : jiafeimao.js
* @Author   : jade
* @Date     : 2024/1/24 9:15
* @Email    : jadehh@1ive.com
* @Software : Samples
* @Desc     : 加菲猫
*/
import {VodSpider} from "./vodSpider.js";
class JiaFeiMaoSpider extends VodSpider {
    constructor() {
        super();
        this.siteUrl = "https://jfmys.app"

    }
    getAppName() {
        return "加菲猫"
    }

    getName() {
        return "🐈|加菲猫|🐈"
    }

}

let spider = new JiaFeiMaoSpider()

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
        search: search,
        proxy: proxy
    };
}