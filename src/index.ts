import {Browser} from "puppeteer";
import * as fs from 'fs';

import PageNavigator from "./pageNavigator";
import PageActionMapper from "./pageActionMapper";
import configurePuppeteerBrowser from "./configurePuppeteerBrowser";

(async function () {
    // Setup
    const browser: Browser = await configurePuppeteerBrowser();
    const page = await browser.newPage();
    const pageNavigator = new PageNavigator(page);
    const pageActionMapper = new PageActionMapper(pageNavigator);

    const results: object[] = [];

    // Go to page
    await pageNavigator.goToUrl('https://www.d20swsrd.com/for-players/magic/spell-descriptions');

    try {
        // close annoying modal if present - failure is ok here
        await pageNavigator.clickElement('#ognannouncement-ok')
    } catch (e) {
    }

    const headers = await pageNavigator.getElementHandleArray('h4');

    for (let header of headers) {
        try {
            // Spell title
            const title = await pageNavigator.getRawText(header);

            // Spell level / Class
            let spellLevelElement = await pageNavigator.getNextElementHandle(header);
            let spellLevel = spellLevelElement ? await pageNavigator.getRawText(spellLevelElement) : null;

            // this is case for "See {Another Spell Here}" entries
            if (spellLevelElement && !spellLevel?.includes('Spell Level: ')) {
                spellLevelElement = await pageNavigator.getNextElementHandle(spellLevelElement);
                spellLevel = spellLevelElement ? await pageNavigator.getRawText(spellLevelElement) : null;
            }

            // handles back-to-back "See {Another Spell Here}" entries
            if (spellLevelElement) {
                const tagName = await pageNavigator.getElementTagName(spellLevelElement);
                if (tagName === 'H4') {
                    continue;
                }
            }

            const learnedBy = spellLevel?.replace('Spell Level: ', '')
                .split(';')
                .map(entry => {
                    const [className, levelText] = entry.split(',');
                    return {
                        className: className.trim(),
                        level: levelText?.match(/\d/g)?.[0],
                    };
                });

            // Range
            const rangeElement = spellLevelElement ? await pageNavigator.getNextElementHandle(spellLevelElement) : null;
            const rangeText = rangeElement ? await pageNavigator.getRawText(rangeElement) : null;
            const range = rangeText ? rangeText.replace('Range:', '').trim() : null;

            // Duration
            const durationElement = rangeElement ? await pageNavigator.getNextElementHandle(rangeElement) : null;
            const durationText = durationElement ? await pageNavigator.getRawText(durationElement) : null;
            const duration = durationText ? durationText.replace('Duration:', '').trim() : null;

            // Description - this is disgusting.
            const description = [];
            let descriptionElement = durationElement ? await pageNavigator.getNextElementHandle(durationElement) : null;
            let descriptionText = descriptionElement ? await pageNavigator.getRawText(descriptionElement) : null;
            description.push(descriptionText);
            descriptionElement = descriptionElement ? await pageNavigator.getNextElementHandle(descriptionElement) : null;
            if (descriptionElement) {
                while (descriptionElement && (await pageNavigator.getElementTagName(descriptionElement)) === 'P') {
                    descriptionText = await pageNavigator.getRawText(descriptionElement);
                    description.push(descriptionText);
                    descriptionElement = await pageNavigator.getNextElementHandle(descriptionElement);
                }
            }

            // Any tables present
            let table;
            let tableElement;
            // tables are nested in divs.
            if (descriptionElement && (await pageNavigator.getElementTagName(descriptionElement)) === 'DIV') {
                tableElement = descriptionElement
                table = await pageNavigator.getElementInnerHtml(tableElement);
            }

            // unrelated entry using same html header
            if (title.includes('OGN Blog')) {
                continue;
            }

            results.push({
                title,
                learnedBy,
                range,
                duration,
                description,
                table,
            });

            // process.exit(0);
        } catch (err) {
            console.log('Failure');
            console.log(err);
            process.exit(1);
        }
    }

    await writeOutputFile(results);
    console.log('fin');

    await browser.close();
    process.exit(0);
})();

function writeOutputFile(obj: object): Promise<void> {
    return new Promise((resolve, reject) => {
        fs.writeFile('./output.json', JSON.stringify(obj), err => {
            if (err) {
                console.error('Error writing file.', err);
                return reject(err);
            }
            return resolve();
        });
    });
}
