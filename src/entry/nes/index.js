import RAM from '../ram'
import CPU from '../cpu/'
import PPU from '../ppu'
import ROM from '../rom'
import Screen from '../screen'
import Control from './control'
import APU from '../apu'

export default class NES{
    constructor(){
        this.ram = new RAM(0x10000)
        this.cpu = new CPU(this.ram)

        this.screen = new Screen()
        this.ppu = new PPU(this.ram, this.cpu)
        this.ppu.connect(this.screen)

        this.p1 = new Control()
        this.p2 = new Control()
        this.apu = new APU(this.ram)

        this.cpu.setPPU(this.ppu)
        this.cpu.setAPU(this.apu)
        this.cpu.setP1(this.p1)
        this.cpu.setP2(this.p2)

        this.apu.setCpu(this.cpu)

    }

    powerUp() {
        this.cpu.powerUp()
        this.ppu.powerUp()
        this.screen.powerUp()
    }

    reset() {
        this.cpu.reset()
        this.ppu.reset()
    }

    start(rom){
        this.cpu.setRom(rom)
        this.ppu.setRom(rom)
        this.powerUp()

        if (requestAnimationFrame) {
            requestAnimationFrame(this.run.bind(this))        
        } else {
            throw new Error('需要requestAnimationFrame支持')
        }
    }

    run() {
        const cycles = (341 * 262 / 3) | 0; // PPU's frequence is about 3 times than cpu
        for(let i = 0; i < cycles; i++) {
          this.cpu.run()
          for(let j=0; j < 3; j++) {
              this.ppu.run()
          }
          // todo enable apu
          this.apu.run()
        }
        window.requestAnimationFrame(this.run.bind(this))        
    }
}