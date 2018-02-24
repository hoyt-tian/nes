import React from 'react'
import ReactDom from 'react-dom'
import NESGui from '../index.jsx'

ReactDom.render(<NESGui />, document.getElementById('reactRoot'))

let comment = document.createElement('section')
document.body.appendChild(comment)

ReactDom.render(<section>
    <div>Github <a href="https://github.com/hoyt-tian/nes" target="_blank">https://github.com/hoyt-tian/nes</a></div>
    <div>技术细节(待更新）<a href="https://www.hoyt-tian.com/tag/nes/" target="_blank">https://www.hoyt-tian.com/tag/nes/</a></div>
</section>, comment)
