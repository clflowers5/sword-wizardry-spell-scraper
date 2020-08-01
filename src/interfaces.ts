interface ConfigBlock {
    type: string,
    elementHandle: string,
    pageNavigation?: boolean,
    outputKey?: string,
    text?: string,
}

interface Args {
    options: {
        debug: boolean,
        runInBrowser: boolean,
        userDataDir: string,
    }
}

export {
    ConfigBlock,
    Args,
}