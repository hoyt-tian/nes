import RAM from '../ram'
import InstructionManager, {AddrMode, IName} from './Insutruction'
import getBit from '../../util/bit'

export const InterruptType = {
    none:   null,
    reset:  Symbol.for('ITR-reset'),
    break:  Symbol.for('ITR-brk'),
    nmi:    Symbol.for('ITR-nmi'),
    irq:    Symbol.for('ITR-irq'),
}

export default class CPU{
    constructor(ram){
        this.counter = 0
        this.ram = ram
        // set registers http://wiki.nesdev.com/w/index.php/CPU_registers
        Object.assign(this, {
            accumulator: 0, // Accumulator
            x: 0, // register x
            y: 0, // register,
            pc: 0, // 2 bytes, program counter
            sp: 0, // stack pointer
            s: 0, // status register
            itr: InterruptType.none,
            cycles: 0
        })
    }

    setRom(rom) {
        this.rom = rom
    }

    setP1(control) {
        this.p1 = control
    }

    setP2(control) {
        this.p2 = control
    }

    setAPU(apu) {
        this.apu = apu
    }

    push(val) {
        this.write(this.sp + 0x100, val)
        this.sp--
        if (this.sp < 0) this.sp += 0x100
    }

    // http://wiki.nesdev.com/w/index.php/CPU_memory_map
    read(addr) {
        addr &= 0xFFFF

        // 0x0800 - 0x1FFF: Mirrors of 0x0000 - 0x07FF (repeats every 0x800 bytes)
        if (addr >=0 && addr < 0x2000) return this.ram[addr & 0x7FF]

        if (addr >= 0x2000 && addr < 0x4000) return this.ppu.readRegister(addr & 0x2007)

        if (addr >= 0x4000 && addr < 0x4014) return this.apu.read(addr) // todo apu process

        if (addr === 0x4014) return this.ppu.readRegister(addr)

        if (addr === 0x4015) return this.apu.read(addr)

        if (addr === 0x4016) return this.p1.read() // todo joystick

        if (addr >= 0x4017 && addr < 0x4020) return this.apu.read(addr)

        if (addr >= 0x4020 && addr < 0x6000) return this.ram[addr] 

        if (addr >= 0x6000 && addr < 0x8000) return this.ram[addr]

        if (addr >= 0x8000 && addr < 0x10000) return this.rom.read(addr)
    }

    write(addr, val) {
        addr &= 0xFFFF

        if( addr >=0 && addr < 0x2000) return this.ram[addr] = val & 0xFF

        if( addr >= 0x2000 && addr < 0x4000){
            // if (val != 0) debugger
            return this.ppu.writeRegister(addr & 0x2007, val)
        } 


        if (addr >= 0x4000 && addr < 0x4014) return this.apu.write(addr, val) 

        if (addr === 0x4014) return this.ppu.writeRegister(addr, val)

        if (addr === 0x4015) return this.apu.write(addr, val)

        if (addr === 0x4016) return this.p1.write(val) 

        if (addr >= 0x4017 && addr < 0x4020) return this.apu.write(addr, val)   // p2 use 0x4017

        if (addr >= 0x4020 && addr < 0x6000) return this.ram[addr] = val & 0xFF

        if (addr >= 0x6000 && addr < 0x8000) return this.ram[addr] = val & 0xFF

        if (addr >= 0x8000 && addr < 0x10000) return this.rom.write(addr, val)
    }

    pop() {
        this.sp++
        this.sp &= 0xFF
        return this.read(this.sp + 0x100)
    }

    get acc() {
        return this.accumulator
    }

    set acc(val) {
        this.accumulator = val
    }
    read2Bytes(addr) {
        return this.read(addr) | (this.read(addr+1) << 8)
    }

    // http://wiki.nesdev.com/w/index.php/CPU_interrupts
    doInterrupt(itr){

        switch(itr){

            case InterruptType.nmi:
                this.brk = 0
                this.unused = 1
                this.push((this.pc>>8) & 0xFF)
                this.push(this.pc & 0xFF)
                this.push(this.s)
                this.nmiOnly = 1
                this.pc = this.read2Bytes(0xFFFA)
                break

            case InterruptType.irq:
                if(this.nmiOnly) return
                this.brk = 0
                this.unused = 1
                this.push((this.pc>>8) & 0xFF)
                this.push(this.pc & 0xFF)
                this.push(this.s)
                this.nmiOnly = 1
                this.pc = this.read2Bytes(0xFFFE)
                break

            case InterruptType.break:
                this.unused = 1
                this.push((this.pc>>8) & 0xFF)
                this.push(this.pc & 0xFF)
                this.push(this.s)
                this.nmiOnly = 1
                this.pc = this.read2Bytes(0xFFFE)
                break

            case InterruptType.reset:
                this.pc = this.read2Bytes(0xFFFC)
                break

            default:
                this.s = this.s | 0x30
                break
        }
    }

    run() {
        if( this.cycles <= 0) {
            this.cycles = this.execute()
        }
        this.cycles--
    }

    execute(){
        if (this.itr !== InterruptType.none) {
            this.doInterrupt(this.itr)
            this.itr = InterruptType.none
        }

        const opCode = this.read(this.pc)
        this.pc++
        const inst = InstructionManager.get(opCode)

        let result = inst.execute.call(inst, this) || 0

        this.counter++
        return inst.cycles + result
    }

    setMapper(mapper){
        this.mapper = mapper
    }

    setPPU(ppu) {
        this.ppu = ppu
    }

    powerUp(){     
        this.acc = 0
        this.x = 0
        this.y = 0
        this.sp = 0xFD
        this.pc = 0x7FFF
        this.s = 0x34

        for(let i=0; i<0xF; i++) {
            this.write(0x4000 + i, 0)
        }
        this.write(0x4015, 0)
        this.write(0x4017, 0)
        this.doInterrupt(InterruptType.reset)
    }

    reset() {
        this.nmiOnly = 1
        this.doInterrupt(InterruptType.reset)
    }

    get carry() {
        return getBit(this.s, 0)
    }

    set carry(val) {
        if (val) {
            return this.s = this.s | 0x01
        } else {
            return this.s = this.s & 0xFE
        }
    }

    get zero(){
        return getBit(this.s, 1)
    }

    set zero(val) {
        val = val ? 1 : 0
        return this.s = (this.s & 0xFD) | (val << 1)
    }

    // 0: /IRQ and /NMI get through; 1: only /NMI gets through
    get nmiOnly(){
        return getBit(this.s, 2)
    }

    set nmiOnly(val) {
        val = val ? 1 : 0
        this.s = (this.s & 0xFB) | (val << 2)
    }

    get decimal(){
        return getBit(this.s, 3)
    }

    set decimal(val) {
        val = val ? 1 : 0
        return this.s = (this.s & 0xF7) | (val << 3)
    }

    get brk() {
        return getBit(this.s, 4)
    }

    set unused(val) {
        val = val ? 1 : 0
        return this.s = (this.s & 0xDF) | (val << 5)
    }

    set brk(val) {
        val = val ? 1 : 0
        this.s = (this.s & 0xEF) | (val << 4)
    }

    get overflow(){
        return getBit(this.s, 6)
    }

    set overflow(val) {
        val = val ? 1 : 0
        this.s = (this.s & 0xBF) | (val << 6)
    }

    get negative(){
        return getBit(this.s, 7)
    }

    set negative(val) {
        val = val ? 1 : 0
        this.s = (this.s & 0x7F) | (val<<7)
    }
}