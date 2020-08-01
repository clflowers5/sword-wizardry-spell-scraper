import StealthPlugin from "puppeteer-extra-plugin-stealth";
import puppeteer from "puppeteer-extra";
import {Browser} from "puppeteer";
import {Args} from "./interfaces";

const DEFAULT_ARGS: Args = {
    options: {
        debug: false,
        runInBrowser: false,
        userDataDir: '',
    },
};

/*
For testing / debugging in browser use:
{
    devtools: true,
    headless: false,
    userDataDir: args.options.userDataDir,
    defaultViewport: {
        width: 1920,
        height: 1080,
    }
}
*/
async function configurePuppeteerBrowser(args: Args = DEFAULT_ARGS): Promise<Browser> {
    puppeteer.use(StealthPlugin());
    return await puppeteer.launch({
        headless: !args.options.runInBrowser,
        userDataDir: args.options.userDataDir,
        defaultViewport: {
            width: 1920,
            height: 1080,
        }
    }) as unknown as Browser; // this unknown is silly
}

export default configurePuppeteerBrowser;
