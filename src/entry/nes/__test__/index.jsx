import ROM from '../../rom'
import NES from '../'
import {Keys} from '../control'


ROM.load('./assets/Contra.nes').then( (rom) => {
    const nes = new NES()

    document.onkeydown = function(event){
        switch(event.keyCode) {
            case 0x57:
                nes.p1.keyDown(Keys.UP)
                break
            case 0x53:
                nes.p1.keyDown(Keys.DOWN)
                break
            case 0x41:
                nes.p1.keyDown(Keys.LEFT)
                break
            case 0x44:
                nes.p1.keyDown(Keys.RIGHT)
                break
            case 0x4E:
                nes.p1.keyDown(Keys.SELECT)
                break
            case 0x4D:
                nes.p1.keyDown(Keys.START)
                break
            case 0x4B:
                nes.p1.keyDown(Keys.A)
                break
            case 0x4A:
                nes.p1.keyDown(Keys.B)
                break
        }
    }

    document.onkeyup = function(event){
        switch(event.keyCode) {
            case 0x57:
                nes.p1.keyUp(Keys.UP)
                break
            case 0x53:
                nes.p1.keyUp(Keys.DOWN)
                break
            case 0x41:
                nes.p1.keyUp(Keys.LEFT)
                break
            case 0x44:
                nes.p1.keyUp(Keys.RIGHT)
                break
            case 0x4E:
                nes.p1.keyUp(Keys.SELECT)
                break
            case 0x4D:
                nes.p1.keyUp(Keys.START)
                break
            case 0x4B:
                nes.p1.keyUp(Keys.A)
                break
            case 0x4A:
                nes.p1.keyUp(Keys.B)
                break
        }
    }
    nes.screen.mount(document.body)
    nes.start(rom)
})

