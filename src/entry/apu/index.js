import Pulse from './pulse'
import Triangle from './triangle'
import Noise from './noise'
import {InterruptType} from '../cpu'
import getBit from '../../util/bit'


export const Channel = {
    PulseA: Symbol.for('PulseA'),
    PulseB: Symbol.for('PulseB'),
    Triangle:   Symbol.for('Triangle'),
    Noise:  Symbol.for('Noise'),
    Square: Symbol.for('Square')
}



class Mixer {

    constructor() {
        this.p1 = true
        this.p2 = true
        this.t = true
        this.n = true
        this.d = false
    }

    setChannel(c, val) {
        val = !!val
        switch(c) {
            case Channel.PulseA:
                this.p1 = val
                break
            case Channel.PulseB:
                this.p2 = val
                break
            case Channel.Triangle:
                this.t = val
                break
            case Channel.Noise:
                this.n = val
                break
            case Channel.Square:
                this.p1 = this.p2 = val
                break
        }
    }

    mixup(p1,p2, t, n, d) {
        p1 = this.p1 ? p1 : 0
        p2 = this.p2 ? p2 : 0
        t = this.t ? t : 0
        n = this.n ? n : 0
        d = this.d ? d : 0
        
        let P = 0
        let R = 0
        if (p1  || p2) {
            P = 95.88 / ((8128/(p1+p2))+100)
        }

        if (t || n || d) {
            R = 159.79 / (1 / (t / 8227 + n / 12241 + d / 22638) + 100)
        }
        return P + R
    }
}

export default class APU {

    constructor(ram) {
        this.ram = ram

        let context = new AudioContext()

        this.sampleData = new Float32Array(4096)

        let script = context.createScriptProcessor(this.sampleData.length, 0, 1)

        script.onaudioprocess = this.process.bind(this)

        script.connect(context.destination)

        this.sampleCycles =  parseInt(1789773 / context.sampleRate)

        this.cycle = 0
        this.cursor = 0
        this.frameStep = 0
        this.pulse1 = new Pulse(this.ram, 0x4000)
        this.pulse2 = new Pulse(this.ram, 0x4004)
        this.triangle = new Triangle(this.ram, 0x4008)
        this.noise = new Noise(this.ram, 0x400C)
        this.mixer = new Mixer()

        this.irqFlag = false
    }


    setCpu(cpu) {
        this.cpu = cpu
    }

    doEnvelope() {
        this.pulse1.doEnvelope()
        this.pulse2.doEnvelope()
        this.triangle.doEnvelope()
        this.noise.doEnvelope()
    }

    lengthCounterAndSweep() {
        this.pulse1.updateLength()
        this.pulse1.updateSweep()

        this.pulse2.updateLength()
        this.pulse2.updateSweep()

        this.triangle.updateLength()

        this.noise.updateLength()
    }

    run() {
        this.cycle++

        if (this.cycle % this.sampleCycles === 0) {
            // 采样
            let p1 = this.pulse1.execute()
            let p2 = this.pulse2.execute()
            let t = this.triangle.execute()
            let n = this.noise.execute()
            let d = 0 //this.dmc.execute()
            let val = this.mixer.mixup(p1, p2, t, n, d)
          
            this.enqueue(val)
        }

        if ( (this.cycle & 0x1) == 0x00) {
            // update timer
            this.pulse1.updateTimer()
            this.pulse2.updateTimer()
            this.noise.updateTimer()
        }

        this.triangle.updateTimer()

        if (this.cycle % 7457 === 0) {
            if (this.is5Steps) {
                switch(this.frameStep) {
                    case 0:
                    case 2:
                        this.doEnvelope()
                        this.lengthCounterAndSweep()
                        break
                    case 1:
                    case 3:
                        this.doEnvelope()
                        break
                }
                this.frameStep = (this.frameStep + 1) % 5
            } else {
                switch(this.frameStep) {
                    case 1:
                    case 3:
                        this.doEnvelope()
                        this.lengthCounterAndSweep()
                        if (this.frameStep == 3 && !this.irqInhibit) {
                            this.irqFlag = true
                        }

                        if (this.irqFlag && this.irqInhibit) {
                            this.cpu.doInterrupt(InterruptType.irq)
                        }
                        break
                    case 0:
                    case 2:
                        this.doEnvelope()
                        break
                }
                this.frameStep = (this.frameStep + 1) % 4
            }

        }
    }

    read(addr) {
        switch(addr) {
            case 0x4015:
                this.irqFlag = false
                return this.status
            default:
                return 0
        }
        
    }

    write(addr, val) {
        if (addr>=0x4000 && addr<=0x4003) {
            this.pulse1.write(addr, val)
        } else if (addr >= 0x4004 && addr <= 0x4007) {
            this.pulse2.write(addr, val)
        } else if (addr >= 0x4008 && addr <= 0x400B) {
            this.triangle.write(addr, val)
        } else if (addr >= 0x400C && addr <= 0x400F) {
            this.noise.write(addr, val)
        } else if (addr >= 0x4010 && addr <= 0x4013) {
            // this.dmc.write(addr, val)
        } else if( addr == 0x4015) {
            this.status = val
        } else if (addr == 0x4017) {
            this.frameCounter = val
        }
    }

    powerUp() {
        this.status = 0x00
    }

    get status() {
        return this.ram[0x4015]
    }

    set status(val) {
        this.ram[0x4015] = val & 0xFF
        
        if (!getBit(val, 0)) {
            this.pulse1.lengthCounter = 0
        }

        if (!getBit(val, 1)) {
            this.pulse2.lengthCounter = 0
        }

        if (!getBit(val, 3)) {
            this.triangle.lengthCounter = 0
        }

        if (!getBit(val, 4)) {
            this.noise.lengthCounter = 0
        }

        return this.status
    }

    get frameCounter() {
        return this.ram[0x4017]
    }

    set frameCounter(val) {
        return this.ram[0x4017] = val
    }

    get is5Steps() {
        return getBit(this.frameCounter, 7)
    }

    get irqInhibit() {
        return getBit(this.frameCounter, 6)
    }

    process(e) {

        let data = e.outputBuffer.getChannelData(0)

        this.sampleData.forEach((d,i)=>data[i]=d)

        if (this.cursor == 0) {
            data[0] = 0.0
            this.cursor++
        }

        for (;this.cursor < this.sampleData.length; this.cursor++) {
            data[this.cursor] = this.sampleData[this.cursor - 1]
        }

        this.cursor = 0
    }

    enqueue(val) {
        if (this.cursor >= this.sampleData.length) return
        this.sampleData[this.cursor++] = val
    }

}