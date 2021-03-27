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
     * @param {string} text
     * @returns {string}
     */
    convert(text) {
        const postUrlRegex = /\[url\].+\[\/url\]|\[url=.+].*\[\/url\]/i;
        const threadUrlRegex = /\[url\].+\[\/url\]|\[url=.+].*\[\/url\]/i;
        let outputLineArr = [];
        const postSplit = text.split('\n');
        postSplit.forEach((line) => {
            const data = this.extractPostData(line);
            if (data === null) {
                outputLineArr.push(line);
                return;
            }

            if (typeof data.post === 'undefined' && data.thread.length !== 0) {
                const { thread } = data;
                const threadTitle = data.title || `[PLAIN]https://forum.idws.id/threads/${thread.slice(2, thread.length)}[/PLAIN]`;
                const replacement = line.replace(threadUrlRegex, `[U][THREAD=${thread.slice(2, thread.length)}]${threadTitle}[/THREAD][/U]`);
                outputLineArr.push(replacement);
            }

            if (data.post.length !== 0) {
                const { post } = data;
                const postTitle = data.title || `[PLAIN]https://forum.idws.id/posts/${post.slice(2, post.length)}[/PLAIN]`;
                const replacement = line.replace(postUrlRegex, `[U][POST=${post.slice(2, post.length)}]${postTitle}[/POST][/U]`);
                outputLineArr.push(replacement);
                return;
            }
            
            console.log(`URL might be malformed or unsupported:\n${line}`);
            outputLineArr.push(line); // fallback
        });
        return outputLineArr.join('\n');
    }

    /**
     * @param {string} input
     */
    async transform(input) {
        const result = this.convert(input);
        this.setState({ output: result });
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
                    this.setState({ input: this.inputElement.value });
                    await this.transform(this.state.input);
                }}>Convert!</button>
            </form>
            {this.Result()}
        </div>);
    }
}

export default IDWSMigrator;