import React from 'react'
import Nes from '../nes'
import ROM from '../rom'
import {Keys, KeyCode} from '../nes/control'
import {Channel} from '../apu'
import './style.less'

export default class NESGui extends React.Component{
    constructor(props, children){
        super(props, children)
        this.nes = new Nes()

        this.state = {
            fps: 0,
            keys: {
                up:     KeyCode.W,
                down:   KeyCode.S,
                left:   KeyCode.A,
                right:  KeyCode.D,
                select: KeyCode.N,
                start:  KeyCode.M,
                A:      KeyCode.K,
                B:      KeyCode.J
            },
            channel: {
                pa: true,
                pb: true,
                t:  true,
                n:  true
            }
        }

        this.nes.screen.afterRedraw = (fps)=>{
            this.setState({
                fps:    fps
            })
        }

        this.mountScreen = this.mountScreen.bind(this)
        this.setChannel = this.setChannel.bind(this)
        this.loadGame = this.loadGame.bind(this)
    }

    componentDidMount() {
        const nes = this.nes
        const currentKey = this.state.keys

        document.onkeydown = function(event){
            switch(event.keyCode) {
                case currentKey.up:
                    nes.p1.keyDown(Keys.UP)
                    break
                case currentKey.down:
                    nes.p1.keyDown(Keys.DOWN)
                    break
                case currentKey.left:
                    nes.p1.keyDown(Keys.LEFT)
                    break
                case currentKey.right:
                    nes.p1.keyDown(Keys.RIGHT)
                    break
                case currentKey.select:
                    nes.p1.keyDown(Keys.SELECT)
                    break
                case currentKey.start:
                    nes.p1.keyDown(Keys.START)
                    break
                case currentKey.A:
                    nes.p1.keyDown(Keys.A)
                    break
                case currentKey.B:
                    nes.p1.keyDown(Keys.B)
                    break
            }
        }
    
        document.onkeyup = function(event){
            switch(event.keyCode) {
                case currentKey.up:
                    nes.p1.keyUp(Keys.UP)
                    break
                case currentKey.down:
                    nes.p1.keyUp(Keys.DOWN)
                    break
                case currentKey.left:
                    nes.p1.keyUp(Keys.LEFT)
                    break
                case currentKey.right:
                    nes.p1.keyUp(Keys.RIGHT)
                    break
                case currentKey.select:
                    nes.p1.keyUp(Keys.SELECT)
                    break
                case currentKey.start:
                    nes.p1.keyUp(Keys.START)
                    break
                case currentKey.A:
                    nes.p1.keyUp(Keys.A)
                    break
                case currentKey.B:
                    nes.p1.keyUp(Keys.B)
                    break
            }
        }
    }

    mountScreen(screenNode){
        if(screenNode) this.nes.screen.mount(screenNode)
    }

    setChannel(event) {
        let target = event.target
        let channel = null
        switch(target.dataset['channel']){
            case "pa":
                channel = Channel.PulseA
                break
            case "pb":
                channel = Channel.PulseB
                break
            case "t":
                channel = Channel.Triangle
                break
            case "n":
                channel = Channel.Noise
                break
            default:
                throw new Error('Unknow channel')
        }

        this.nes.apu.mixer.setChannel(channel, target.checked)
        this.state.channel[target.dataset['channel']] = target.checked
    }

    loadGame(event) {
        const nes = this.nes
        if (event.target.value != '')
            ROM.load(`./assets/${event.target.value}.nes`).then( (rom) => {
                nes.start(rom)
            })
    }

    render() {
        return (<article className="nes">
            <section className="screen" ref={this.mountScreen}></section>
            <section className="aside">
                <section>
                    <div>ROM:<select onChange={this.loadGame}>
                                <option value="" defaultValue>请选择...</option>
                                <option value="Contra">魂斗罗</option>
                                <option value="nestest">指令测试</option>
                                <option value="color_test">色彩测试</option>
                                <option value="scanline">扫描渲染</option>
                                <option value="square_timer_div2">方波测试</option>
                                <option value="noise">噪声测试</option>
                            </select></div>
                    <div>FPS:{Number(this.state.fps).toFixed(1)}</div>
                </section>

                <section>
                    <div>Sound Channel</div>
                    <div><input type="checkbox"  onChange = {this.setChannel} data-channel="pa" checked={this.state.channel.pa} />PulseA</div>
                    <div><input type="checkbox"  onChange = {this.setChannel} data-channel="pb" checked={this.state.channel.pb} />PulseB</div>
                    <div><input type="checkbox"  onChange = {this.setChannel} data-channel="t" checked={this.state.channel.t} />Triangle</div>
                    <div><input type="checkbox"  onChange = {this.setChannel} data-channel="n" checked={this.state.channel.n} />Noise</div>
                </section>
                <section>
                    <table>
                        <thead>
                            <tr><th>Button</th><th>Key</th></tr>
                        </thead>
                        <tbody>
                            <tr><td>上</td><td>W</td></tr>
                            <tr><td>下</td><td>S</td></tr>
                            <tr><td>左</td><td>A</td></tr>
                            <tr><td>右</td><td>D</td></tr>
                            <tr><td>选择</td><td>N</td></tr>
                            <tr><td>开始</td><td>M</td></tr>
                            <tr><td>B</td><td>J</td></tr>
                            <tr><td>A</td><td>K</td></tr>
                        </tbody>
                    </table>
                </section>
            </section>
        </article>)
    }
}