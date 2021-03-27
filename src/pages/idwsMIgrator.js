// @ts-check
import React from 'react';
import '../styles/migrator.css';

/**
 * @typedef {Object} IRegexes
 * @property {RegExp} default
 * @property {RegExp} customTitle
 */

class IDWSMigrator extends React.Component {
    constructor(props) {
        super(props);
        /**
         * @type {{ input: string; output: string }}
         */
        this.state = { input: null, output: null };
        this.inputElement = null;
    }
    
    /**
     * @description handle forum.indowebster.com domain
     * default: [URL]https://forum.indowebster.com/showthread.php?t=xxxx&p=xxxxx[/url]
     * customTitle: [url=https://forum.indowebster.com/showthread.php?t=xxxx&p=xxxxx]IDWS[/url]
     * @returns {IRegexes}
     */
    newDomainRegexes() {
        return {
            default: /\[URL\](http|https):\/\/forum\.indowebster\.com\/.+\?(?<thread>t=\d+){0,1}&{0,1}(?<post>p=\d+){0,1}.+\[\/URL\]/i,
            customTitle: /\[URL="{0,1}(http|https):\/\/forum\.indowebster\.com\/.+\?(?<thread>t=\d+){0,1}&{0,1}(?<post>p=\d+){0,1}.*"{0,1}\](?<title>.*)\[\/URL\]/i,
        };
    }

    /**
     * @description handle www.indowebster.web.id domain
     * @returns {IRegexes}
     */
    oldDomainRegexes() {
        return {
            default: /\[URL\](http|https):\/\/www\.indowebster\.web\.id\/.+\?(?<thread>t=\d+){0,1}&{0,1}(?<post>p=\d+){0,1}.+\[\/URL\]/i,
            customTitle: /\[URL="{0,1}(http|https):\/\/www\.indowebster\.web\.id\/.+\?(?<thread>t=\d+){0,1}&{0,1}(?<post>p=\d+){0,1}.*"{0,1}\](?<title>.*)\[\/URL\]/i,
        };
    }

    /**
     * @param {string} text
     * @returns {null | {post?: string; thread?: string; title?: string} }
     */
    extractPostData(text) {
        const oldDomain = 'www.indowebster.web.id';
        let regexes;
        if (text.search(oldDomain) === -1) {
            regexes = this.newDomainRegexes();
        } else {
            regexes = this.oldDomainRegexes();
        }
        const match = text.match(regexes.customTitle) || text.match(regexes.default);
        if (match === null) {
            return null;
        }
        return {
            post: match.groups.post,
            thread: match.groups.thread,
            title: match.groups.title, // may be undefined if using default regex definition
        };
    }

    /**
     * @returns {RegExp}
     */
    postUrlRegex() {
        return /\[url\].+\[\/url\]|\[url=.+].*\[\/url\]/i;
    }

    /**
     * @returns {RegExp}
     */
    threadUrlRegex() {
        return /\[url\].+\[\/url\]|\[url=.+].*\[\/url\]/i;
    }

    /**
     * @returns {string}
     */
    occurenceKeyword() {
        return '[/URL]';
    }

    /**
     * @param {string} text
     * @returns {boolean}
     */
    isMultipleUrlOccurence(text) {
        if (text.toUpperCase().indexOf('[/URL]') === text.toUpperCase().lastIndexOf('[/URL]')) {
            return false;
        }
        return true;
    }

    /**
     * @param {*} text 
     * @param {{ thread: string; title?: string }} data
     * @returns {string}
     */
    convertToThread(text, data) {
        const { thread } = data;
        const threadTitle = data.title || `[PLAIN]https://forum.idws.id/threads/${thread.slice(2, thread.length)}[/PLAIN]`;
        const replacement = text.replace(this.threadUrlRegex(), `[U][THREAD=${thread.slice(2, thread.length)}]${threadTitle}[/THREAD][/U]`);
        return replacement;
    }

    /**
     * @param {*} text 
     * @param {{ post: string; title?: string }} data
     * @returns {string}
     */
    convertToPost(text, data) {
        const { post } = data;
        const postTitle = data.title || `[PLAIN]https://forum.idws.id/posts/${post.slice(2, post.length)}[/PLAIN]`;
        const replacement = text.replace(this.postUrlRegex(), `[U][POST=${post.slice(2, post.length)}]${postTitle}[/POST][/U]`);
        return replacement;
    }

    /**
     * @param {string} text
     * @returns {string}
     */
    singleOccurenceConversion(text) {
        const data = this.extractPostData(text);
        if (data === null) {
            return text;
        }

        if (typeof data.post !== 'undefined' && data.post.length !== 0) {
            return this.convertToPost(text, { post: data.post, title: data.title });
        }

        if (typeof data.thread !== 'undefined' && data.thread.length !== 0) {
            return this.convertToThread(text, { thread: data.thread, title: data.title });
        }
            
        console.log(`URL might be unsupported:\n${text}`);
        return text;
    }

    /**
     * @param {string} text
     * @returns {string}
     */
    multipleOccurenceConversion(text) {
        let currentIndex = 0;
        let offset = 0;
        const lastIndex = text.lastIndexOf(this.occurenceKeyword());
        let tempLine = [];
        while(currentIndex !== lastIndex) {
            const occurenceIndex = text.indexOf(this.occurenceKeyword(), currentIndex + offset);
            const slicedText = text.slice(currentIndex + offset, occurenceIndex + this.occurenceKeyword().length);
            tempLine.push(this.singleOccurenceConversion(slicedText));
            offset = this.occurenceKeyword().length;
            currentIndex = occurenceIndex;
        }
        // handle excess text after the URL tag
        if (lastIndex + this.occurenceKeyword().length < text.length) {
            const lastSlice = text.slice(lastIndex + offset, text.length);
            tempLine.push(lastSlice);
        }
        return tempLine.join('');
    }

    /**
     * @param {string} text
     * @returns {string}
     */
    convert(text) {
        let outputLineArr = [];
        const postSplit = text.split('\n');
        postSplit.forEach((line) => {
            if (this.isMultipleUrlOccurence(line)) {
                outputLineArr.push(this.multipleOccurenceConversion(line));
                return;
            }
            outputLineArr.push(this.singleOccurenceConversion(line));
        });
        return outputLineArr.join('\n');
    }

    /**
     * @param {string} input
     */
    async transform(input) {
        if (typeof input === 'undefined' || input === null || input.length === 0) {
            alert('input is empty');
            return;
        }
        const result = this.convert(input);
        await this.setState({ output: result });
    }

    Result() {
        return (<div style={{margin: '50px' }}>
            <label>Result:</label>
            <br></br>
            <pre>{ this.state.output }</pre>
        </div>);
    }

    render() {
        return (<div>
            <form>
                <label>Input Your BBCode Post To Convert</label>
                <br></br>
                <textarea rows={10} cols={100} ref={(element) => {
                    this.inputElement = element;
                }}></textarea>
                <br></br>
                <button value='Convert!' onClick={async (e) => {
                    e.preventDefault();
                    await this.setState({ input: this.inputElement.value });
                    await this.transform(this.state.input);
                }}>Convert!</button>
            </form>
            {this.Result()}
        </div>);
    }
}

export default IDWSMigrator;