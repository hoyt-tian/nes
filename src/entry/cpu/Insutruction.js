import getBit from '../../util/bit'
import { InterruptType } from './index';

const IName = {
    ADC:    Symbol.for('ADC'),
    AND:    Symbol.for('AND'),
    ASL:    Symbol.for('ASL'),
    BCC:    Symbol.for('BCC'),
    BCS:    Symbol.for('BCS'),
    BEQ:    Symbol.for('BEQ'),
    BIT:    Symbol.for('BIT'),
    BMI:    Symbol.for('BMI'),
    BNE:    Symbol.for('BNE'),
    BPL:    Symbol.for('BPL'),
    BRK:    Symbol.for('BRK'),
    BVC:    Symbol.for('BVC'),
    BVS:    Symbol.for('BVS'),
    CLC:    Symbol.for('CLC'),
    CLD:    Symbol.for('CLD'),
    CLI:    Symbol.for('CLI'),
    CLV:    Symbol.for('CLV'),
    CMP:    Symbol.for('CMP'),
    CPX:    Symbol.for('CPX'),
    CPY:    Symbol.for('CPY'),
    DEC:    Symbol.for('DEC'),
    DEX:    Symbol.for('DEX'),
    DEY:    Symbol.for('DEY'),
    EOR:    Symbol.for('EOR'),
    INC:    Symbol.for('INC'),
    INX:    Symbol.for('INX'),
    INY:    Symbol.for('INY'),
    JMP:    Symbol.for('JMP'),
    JSR:    Symbol.for('JSR'),
    LDA:    Symbol.for('LDA'),
    LDX:    Symbol.for('LDX'),
    LDY:    Symbol.for('LDY'),
    LSR:    Symbol.for('LSR'),
    NOP:    Symbol.for('NOP'),
    ORA:    Symbol.for('ORA'),
    PHA:    Symbol.for('PHA'),
    PHP:    Symbol.for('PHP'),
    PLA:    Symbol.for('PLA'),
    ROL:    Symbol.for('ROL'),
    ROR:    Symbol.for('ROR'),
    RTI:    Symbol.for('RTI'),
    RTS:    Symbol.for('RTS'),
    SBC:    Symbol.for('SBC'),
    SEC:    Symbol.for('SEC'),
    SED:    Symbol.for('SED'),
    SEI:    Symbol.for('SEI'),
    STA:    Symbol.for('STA'),
    STX:    Symbol.for('STX'),
    STY:    Symbol.for('STY'),
    TAX:    Symbol.for('TAX'),
    TAY:    Symbol.for('TAY'),
    TSX:    Symbol.for('TSX'),
    TXA:    Symbol.for('TXA'),
    TXS:    Symbol.for('TXS'),
    TYA:    Symbol.for('TYA'),
}

const AddrMode = {
    Immediate:  Symbol.for('Immediate'),
    ZeroPage:   Symbol.for('Zero Page'),
    ZeroPageX:  Symbol.for('Zero Page X'),
    ZeroPageY:  Symbol.for('Zero Page Y'),
    Absolute:   Symbol.for('Absolute'),
    AbsoluteX:  Symbol.for('AbsoluteX'),
    AbsoluteY:  Symbol.for('AbsoluteY'),
    IndirectX:  Symbol.for('Indirect X'),
    IndirectY:  Symbol.for('Indirect Y'),
    Accumulator: Symbol.for('Accumulator'),
    Relative:   Symbol.for('Relative'),
    Implied:    Symbol.for('Implied'),
    Indirect:   Symbol.for('Indirect'),
}

const instructions = new Array(256) 



const helper = (name, code, addrMode, bytes, cycle) => {
    instructions[code] = new Instruction(name, code, addrMode, bytes, cycle)
}

class Instruction{
    constructor(name, opCode, addrMode, bytes, cycles){
        Object.assign(this, {name, opCode, addrMode, bytes, cycles, execute: null})
    }

    toString() {
        return `name:${this.name.toString()}, opCode: ${this.opCode}, AddrMode: ${this.addrMode.toString()}, Bytes: ${this.bytes}, Cycle: ${this.cycles}`
    }
}

// http://obelisk.me.uk/6502/reference.html
[
    // Add With Carry
    [IName.ADC, 0x69,   AddrMode.Immediate,     2,    2],
    [IName.ADC, 0x65,   AddrMode.ZeroPage,      2,    3],
    [IName.ADC, 0x75,   AddrMode.ZeroPageX,     2,    4],
    [IName.ADC, 0x6D,   AddrMode.Absolute,      3,    4],
    [IName.ADC, 0x7D,   AddrMode.AbsoluteX,     3,    4],
    [IName.ADC, 0x79,   AddrMode.AbsoluteY,     3,    4],
    [IName.ADC, 0x61,   AddrMode.IndirectX,     2,    6],
    [IName.ADC, 0x71,   AddrMode.IndirectY,     2,    5],

    // Logical AND
    [IName.AND, 0x29,   AddrMode.Immediate,     2,    2],
    [IName.AND, 0x25,   AddrMode.ZeroPage,      2,    3],
    [IName.AND, 0x35,   AddrMode.ZeroPageX,     2,    4],
    [IName.AND, 0x2D,   AddrMode.Absolute,      3,    4],
    [IName.AND, 0x3D,   AddrMode.AbsoluteX,     3,    4],
    [IName.AND, 0x39,   AddrMode.AbsoluteY,     3,    4],
    [IName.AND, 0x21,   AddrMode.IndirectX,     2,    6],
    [IName.AND, 0x31,   AddrMode.IndirectY,     2,    5],

    // Arithmetic Shift Left
    [IName.ASL, 0x0A,   AddrMode.Accumulator,   1,    2],
    [IName.ASL, 0x06,   AddrMode.ZeroPage,      2,    5],
    [IName.ASL, 0x16,   AddrMode.ZeroPageX,     2,    6],
    [IName.ASL, 0x0E,   AddrMode.Absolute,      3,    6],
    [IName.ASL, 0x1E,   AddrMode.AbsoluteX,     3,    7],

    // Branch if Carry Clear
    [IName.BCC, 0x90,   AddrMode.Relative,      2,    2],

    // Branch if carry set
    [IName.BCS, 0xB0,   AddrMode.Relative,      2,    2],

    // Branch if Equal
    [IName.BEQ, 0xF0,   AddrMode.Relative,      2,    2],

    // Bit Test
    [IName.BIT, 0x24,   AddrMode.ZeroPage,      2,    3],
    [IName.BIT, 0x2C,   AddrMode.Absolute,      3,    4],

    // Branch if Minus
    [IName.BMI, 0x30,   AddrMode.Relative,      2,    2],

    // Branch if Not Equal
    [IName.BNE, 0xD0,   AddrMode.Relative,      2,    2],

    // Branch if Positive
    [IName.BPL, 0x10,   AddrMode.Relative,      2,    2],

    // BRK Force Interrupt
    [IName.BRK, 0x00,   AddrMode.Implied,       1,    7],

    // Branch if Overflow Clear
    [IName.BVC, 0x50,   AddrMode.Relative,      2,    2],

    // Branch if Overflow Set
    [IName.BVS, 0x70,   AddrMode.Relative,      2,    2],

    // Clear Carry Flag
    [IName.CLC, 0x18,   AddrMode.Implied,       1,    2],

    // Clear Decimal Mode
    [IName.CLD, 0xD8,   AddrMode.Implied,       1,    2],

    // Clear Interrupt Disable
    [IName.CLI, 0x58,   AddrMode.Implied,       1,    2],

    // Clear Overflow Flag
    [IName.CLV, 0xB8,   AddrMode.Implied,       1,    2],

    // Compare
    [IName.CMP, 0xC9,   AddrMode.Immediate,     2,    2],
    [IName.CMP, 0xC5,   AddrMode.ZeroPage,      2,    3],
    [IName.CMP, 0xD5,   AddrMode.ZeroPageX,     2,    4],
    [IName.CMP, 0xCD,   AddrMode.Absolute,      3,    4],
    [IName.CMP, 0xDD,   AddrMode.AbsoluteX,     3,    4],
    [IName.CMP, 0xD9,   AddrMode.AbsoluteY,     3,    4],
    [IName.CMP, 0xC1,   AddrMode.IndirectX,     2,    6],
    [IName.CMP, 0xD1,   AddrMode.IndirectY,     2,    5],

    // Compare X Register
    [IName.CPX, 0xE0,   AddrMode.Immediate,    2,    2],
    [IName.CPX, 0xE4,   AddrMode.ZeroPage,     2,    3],
    [IName.CPX, 0xEC,   AddrMode.Absolute,     3,    4],

    // Compare Y Register
    [IName.CPY, 0xC0,   AddrMode.Immediate,    2,    2],
    [IName.CPY, 0xC4,   AddrMode.ZeroPage,     2,    3],
    [IName.CPY, 0xCC,   AddrMode.Absolute,     3,    4],

    // Decrement memory
    [IName.DEC, 0xC6,   AddrMode.ZeroPage,      2,    5],
    [IName.DEC, 0xD6,   AddrMode.ZeroPageX,     2,    6],
    [IName.DEC, 0xCE,   AddrMode.Absolute,      3,    6],
    [IName.DEC, 0xDE,   AddrMode.AbsoluteX,     3,    7],

    // Decrement X Register
    [IName.DEX, 0xCA,   AddrMode.Implied,       1,    2],

    // Decrement Y Register
    [IName.DEY, 0x88,   AddrMode.Implied,       1,    2],

    // Exclusive OR
    [IName.EOR, 0x49,   AddrMode.Immediate,       2,    2],
    [IName.EOR, 0x45,   AddrMode.ZeroPage,        2,    3],
    [IName.EOR, 0x55,   AddrMode.ZeroPageX,       2,    4],
    [IName.EOR, 0x4D,   AddrMode.Absolute,        3,    4],
    [IName.EOR, 0x5D,   AddrMode.AbsoluteX,       3,    4],
    [IName.EOR, 0x59,   AddrMode.AbsoluteY,       3,    4],
    [IName.EOR, 0x41,   AddrMode.IndirectX,       2,    6],
    [IName.EOR, 0x51,   AddrMode.IndirectY,       2,    5],

    // Increment Memory
    [IName.INC, 0xE6,   AddrMode.ZeroPage,        2,    5],
    [IName.INC, 0xF6,   AddrMode.ZeroPageX,       2,    6],
    [IName.INC, 0xEE,   AddrMode.Absolute,        3,    6],
    [IName.INC, 0xFE,   AddrMode.AbsoluteX,       3,    7],

    // Increment X Register
    [IName.INX, 0xE8,   AddrMode.Implied,         1,    2],

    // Increment Y Register
    [IName.INY, 0xC8,   AddrMode.Implied,         1,    2],

    // Jump
    [IName.JMP, 0x4C,   AddrMode.Absolute,         3,    0],
    [IName.JMP, 0x6C,   AddrMode.Indirect,         3,    0],

    // Jump to Subroutine
    [IName.JSR, 0x20,   AddrMode.Absolute,         3,    0],

    // Load Accumulator
    [IName.LDA, 0xA9,   AddrMode.Immediate,        2,    2],
    [IName.LDA, 0xA5,   AddrMode.ZeroPage,         2,    3],
    [IName.LDA, 0xB5,   AddrMode.ZeroPageX,        2,    4],
    [IName.LDA, 0xAD,   AddrMode.Absolute,         3,    4],
    [IName.LDA, 0xBD,   AddrMode.AbsoluteX,        3,    4],
    [IName.LDA, 0xB9,   AddrMode.AbsoluteY,        3,    4],
    [IName.LDA, 0xA1,   AddrMode.IndirectX,        2,    6],
    [IName.LDA, 0xB1,   AddrMode.IndirectY,        2,    5],

    // Load X Register
    [IName.LDX, 0xA2,   AddrMode.Immediate,        2,    2],
    [IName.LDX, 0xA6,   AddrMode.ZeroPage,         2,    3],
    [IName.LDX, 0xB6,   AddrMode.ZeroPageY,        2,    4],
    [IName.LDX, 0xAE,   AddrMode.Absolute,         3,    4],
    [IName.LDX, 0xBE,   AddrMode.AbsoluteY,        3,    4],

    // Load Y Register
    [IName.LDY, 0xA0,   AddrMode.Immediate,        2,    2],
    [IName.LDY, 0xA4,   AddrMode.ZeroPage,         2,    3],
    [IName.LDY, 0xB4,   AddrMode.ZeroPageX,        2,    4],
    [IName.LDY, 0xAC,   AddrMode.Absolute,         3,    4],
    [IName.LDY, 0xBC,   AddrMode.AbsoluteX,        3,    4],

    // Logical Shift Right
    [IName.LSR, 0x4A,   AddrMode.Accumulator,      1,    2],
    [IName.LSR, 0x46,   AddrMode.ZeroPage,         2,    5],
    [IName.LSR, 0x56,   AddrMode.ZeroPageX,        2,    6],
    [IName.LSR, 0x4E,   AddrMode.Absolute,         3,    6],
    [IName.LSR, 0x5E,   AddrMode.AbsoluteX,        3,    7],

    // No Operation
    [IName.NOP, 0xEA,   AddrMode.Implied,        1,    2],

    // Logical Inclusive OR
    [IName.ORA, 0x09,   AddrMode.Immediate,        2,    2],
    [IName.ORA, 0x05,   AddrMode.ZeroPage,         2,    3],
    [IName.ORA, 0x15,   AddrMode.ZeroPageX,        2,    4],
    [IName.ORA, 0x0D,   AddrMode.Absolute,         3,    4],
    [IName.ORA, 0x1D,   AddrMode.AbsoluteX,        3,    4],
    [IName.ORA, 0x19,   AddrMode.AbsoluteY,        3,    4],
    [IName.ORA, 0x01,   AddrMode.IndirectX,        2,    6],
    [IName.ORA, 0x11,   AddrMode.IndirectY,        2,    5],

    // Push Accumulator
    [IName.PHA, 0x48,   AddrMode.Implied,           1,    3],

    // Push Processor Status
    [IName.PHP, 0x08,   AddrMode.Implied,           1,    3],

    // Pull Accumulator
    [IName.PLA, 0x68,   AddrMode.Implied,           1,    4],

    // Pull Processor Status
    [IName.PLP, 0x28,   AddrMode.Implied,           1,    4],

    // Rotate Left
    [IName.ROL, 0x2A,   AddrMode.Accumulator,       1,    2],
    [IName.ROL, 0x26,   AddrMode.ZeroPage,          2,    5],
    [IName.ROL, 0x36,   AddrMode.ZeroPageX,         2,    6],
    [IName.ROL, 0x2E,   AddrMode.Absolute,          3,    6],
    [IName.ROL, 0x3E,   AddrMode.AbsoluteX,         3,    7],

    // Rotate Right
    [IName.ROR, 0x6A,   AddrMode.Accumulator,       1,    2],
    [IName.ROR, 0x66,   AddrMode.ZeroPage,          2,    5],
    [IName.ROR, 0x76,   AddrMode.ZeroPageX,         2,    6],
    [IName.ROR, 0x6E,   AddrMode.Absolute,          3,    6],
    [IName.ROR, 0x7E,   AddrMode.AbsoluteX,         3,    7],

    // Return from Interrupt
    [IName.RTI, 0x40,   AddrMode.Implied,       1,    6],

    // Return from Subroutine
    [IName.RTS, 0x60,   AddrMode.Implied,       1,    6],

    // Substract with Carry
    [IName.SBC, 0xE9,   AddrMode.Immediate,         2,    2],
    [IName.SBC, 0xE5,   AddrMode.ZeroPage,        2,    3],
    [IName.SBC, 0xF5,   AddrMode.ZeroPageX,       2,    4],
    [IName.SBC, 0xED,   AddrMode.Absolute,        3,    4],
    [IName.SBC, 0xFD,   AddrMode.AbsoluteX,       3,    4],
    [IName.SBC, 0xF9,   AddrMode.AbsoluteY,       3,    4],
    [IName.SBC, 0xE1,   AddrMode.IndirectX,       2,    6],
    [IName.SBC, 0xF1,   AddrMode.IndirectY,       2,    5],

    // Set Carry Flag
    [IName.SEC, 0x38,   AddrMode.Implied,       1,    2],

    // set Decimal Flag
    [IName.SED, 0xF8,   AddrMode.Implied,       1,    2],

    // Set Interrupt Disable
    [IName.SEI, 0x78,   AddrMode.Implied,       1,    2],

    // Store Accumulator
    [IName.STA, 0x85,   AddrMode.ZeroPage,        2,    3],
    [IName.STA, 0x95,   AddrMode.ZeroPageX,       2,    4],
    [IName.STA, 0x8D,   AddrMode.Absolute,        3,    4],
    [IName.STA, 0x9D,   AddrMode.AbsoluteX,       3,    5],
    [IName.STA, 0x99,   AddrMode.AbsoluteY,       3,    5],
    [IName.STA, 0x81,   AddrMode.IndirectX,       2,    6],
    [IName.STA, 0x91,   AddrMode.IndirectY,       2,    6],

    // Store X Register
    [IName.STX, 0x86,   AddrMode.ZeroPage,        2,    3],
    [IName.STX, 0x96,   AddrMode.ZeroPageY,       2,    4],
    [IName.STX, 0x8E,   AddrMode.Absolute,        3,    4],

    // Store Y Register
    [IName.STY, 0x84,   AddrMode.ZeroPage,        2,    3],
    [IName.STY, 0x94,   AddrMode.ZeroPageX,       2,    4],
    [IName.STY, 0x8C,   AddrMode.Absolute,        3,    4],

    // Transfer Accumulator to X
    [IName.TAX, 0xAA,   AddrMode.Implied,        1,    2],

    // Transfer Accumulator to X
    [IName.TAY, 0xA8,   AddrMode.Implied,        1,    2],

    // Transfer Stack Pointer to X
    [IName.TSX, 0xBA,   AddrMode.Implied,        1,    2],

    // Transfer x to Accumulator
    [IName.TXA, 0x8A,   AddrMode.Implied,        1,    2],

    // Transfer x to Stack Pointer
    [IName.TXS, 0x9A,   AddrMode.Implied,        1,    2],

    // Transfer Y to Accumulator
    [IName.TYA, 0x98,   AddrMode.Implied,        1,    2],

].forEach( el => helper.apply(null, el) )

const InstructionManager = {
    get: (opCode) => instructions[opCode],
}

const findByName = (name) => {
    return (exec) => {
        instructions.filter( (el) => el.name === name ).forEach( (el) => {
            el.execute = (cpu) => {
                return exec.call(el, cpu)
            }
        })
    }
}

const getAddr = (cpu, addrMode) => {
    let addr = null
    switch (addrMode) {
        case AddrMode.Immediate:
        case AddrMode.Relative:
            addr = cpu.pc
            cpu.pc++
            break
        case AddrMode.Absolute:
        case AddrMode.AbsoluteX:
        case AddrMode.AbsoluteY:
            addr = cpu.read2Bytes(cpu.pc)
            cpu.pc += 2
            if ( addrMode === AddrMode.AbsoluteX ){
                addr += cpu.x
            } else if ( addrMode === AddrMode.AbsoluteY ){
                addr += cpu.y
            }
            addr &= 0xFFFF
            break
        case AddrMode.ZeroPage:
        case AddrMode.ZeroPageX:
        case AddrMode.ZeroPageY:
            addr = cpu.read(cpu.pc)
            cpu.pc++
            if (addrMode === AddrMode.ZeroPageX) {
                addr += cpu.x
            } else if(addrMode === AddrMode.ZeroPageY) {
                addr += cpu.y
            }
            addr &= 0xFF
            break
        case AddrMode.Indirect:
            addr = cpu.read2Bytes(cpu.pc)
            cpu.pc+=2
            addr = cpu.read(addr) | (cpu.read((addr & 0xFF00) | ((addr+1) & 0xFF)) << 8) 
            break
        case AddrMode.IndirectX:
            addr = cpu.read(cpu.pc)
            cpu.pc++
            addr += cpu.x
            addr &= 0xFF
            addr = cpu.ram[addr & 0xFF] | (cpu.ram[(addr + 1) & 0xFF] << 8)
            break
        case AddrMode.IndirectY:
            addr = cpu.read(cpu.pc)
            cpu.pc++
            addr = cpu.ram[addr & 0xFF] | (cpu.ram[((addr + 1) & 0xFF)] << 8);// load2BytesFromZeroPage
            addr += cpu.y
            addr &= 0xFFFF
            break
        default:
            throw new Error('unkown address mode')
    }
    return addr
}

const readAddr = (cpu, addrMode) => {
    if (addrMode === AddrMode.Accumulator) {
        return cpu.acc
    }
    const addr = getAddr(cpu, addrMode)
    let val  = cpu.read(addr)

    if (addrMode === AddrMode.Relative) {
        if ( val & 0x80) {
            val = val | 0xFF00
        }
    }
    return val
}

const updateAddr = (cpu, addrMode, callback) => {
    let result
    if (addrMode === AddrMode.Accumulator) {
        result = callback(cpu.acc)
        cpu.acc = result & 0xFF
    } else {
        let addr = getAddr(cpu, addrMode)
        let val = cpu.read(addr)
        result = callback(val)
        cpu.write(addr, result)
    }
}

const writeAddr = (cpu, addrMode, val) => {
    // if(cpu.counter == 9145) debugger
    if (addrMode === AddrMode.Accumulator) {
        cpu.acc = val & 0xFF
        return
    }
    cpu.write(getAddr(cpu, addrMode), val)
}

findByName(IName.ADC)(function(cpu){
    const acc = cpu.acc
    let val = cpu.read(getAddr(cpu, this.addrMode))
    let result = cpu.acc + val + cpu.carry
    cpu.carry = result & 0x100
    cpu.negative =  getBit(result, 7)
    cpu.zero = (0xFF & result) === 0
    cpu.acc = result & 0xFF

    if(!((val ^ acc) & 0x80) && ((val ^ result) & 0x80))
        cpu.overflow = 1
    else
        cpu.overflow = 0
})

findByName(IName.AND)(function(cpu){
    let result = cpu.acc & cpu.read(getAddr(cpu, this.addrMode))
    cpu.negative = getBit(result, 7)
    cpu.acc = result & 0xFF
    cpu.zero = (0xFF & result) === 0
})


findByName(IName.ASL)(function(cpu) {
    updateAddr(cpu, this.addrMode, (src) => {
        let result = src << 1
        cpu.negative = getBit(result, 7)
        cpu.zero = (0xFF & result) === 0
        cpu.carry = result & 0x100
        return result
    })
})

findByName(IName.BCC)(function(cpu) {
    let result = readAddr(cpu, this.addrMode)
    if (cpu.carry === 0) {
        cpu.pc += result
        cpu.pc &= 0xFFFF
    }
})

findByName(IName.BCS)(function(cpu,) {
    let result = readAddr(cpu, this.addrMode)
    if (cpu.carry === 1) {
        cpu.pc += result
        cpu.pc &= 0xFFFF
    }
})

findByName(IName.BEQ)(function(cpu) {
    let result = readAddr(cpu, this.addrMode)
    if (cpu.zero) {
        cpu.pc += result
        cpu.pc &= 0xFFFF
    }
})

findByName(IName.BIT)(function(cpu) {
    let val = readAddr(cpu, this.addrMode)
    let result = cpu.acc & val
    cpu.negative = getBit(val, 7)
    cpu.zero = (0xFF & result) === 0
    cpu.overflow = (val & 0x40) ? 1 : 0
})

findByName(IName.BMI)(function(cpu) {
    let result = readAddr(cpu, this.addrMode)
    if (cpu.negative) {
        cpu.pc += result
        cpu.pc &= 0xFFFF
    }
})

findByName(IName.BNE)(function(cpu) {
    let result = readAddr(cpu, this.addrMode)
    if (!cpu.zero) {
        cpu.pc += result
        cpu.pc &= 0xFFFF
    }
})

findByName(IName.BPL)(function(cpu) {
    let result = readAddr(cpu, this.addrMode)
    if (!cpu.negative) {
        cpu.pc += result
        cpu.pc &= 0xFFFF
    }
})

findByName(IName.BRK)(function(cpu) {
    cpu.pc++
    cpu.s = cpu.s | 0x20
    cpu.brk = 1
    cpu.doInterrupt(InterruptType.break)
})

findByName(IName.BVC)(function(cpu) {
    let result = readAddr(cpu, this.addrMode)
    if (!cpu.overflow) {
        cpu.pc += result
        cpu.pc &= 0xFFFF
    }
})


findByName(IName.BVS)(function(cpu) {
    let result = readAddr(cpu, this.addrMode)
    if (cpu.overflow) {
        cpu.pc += result
        cpu.pc &= 0xFFFF
    }
})

findByName(IName.CLC)(function(cpu) {
    cpu.carry = 0
})

findByName(IName.CLD)(function(cpu) {
    cpu.decimal = 0
})

findByName(IName.CLI)(function(cpu) {
    cpu.nmiOnly = 0
})

findByName(IName.CLV)(function(cpu) {
    cpu.overflow = 0
})

findByName(IName.CMP)(function(cpu) {
    let val = readAddr(cpu, this.addrMode)
    let result = cpu.acc - val
    cpu.negative = getBit(result, 7)
    cpu.zero = result === 0
    cpu.carry = cpu.acc >= val 
})

findByName(IName.CPX)(function(cpu) {
    let val = readAddr(cpu, this.addrMode)
    let result = cpu.x - val
    cpu.negative = getBit(result, 7)
    cpu.zero = (0xFF & result) === 0
    cpu.carry = cpu.x >= val ? 1 : 0
})

findByName(IName.CPY)(function(cpu) {
    let val = readAddr(cpu, this.addrMode)
    let result = cpu.y - val
    cpu.negative = getBit(result, 7)
    cpu.zero = ( 0xFF & result ) === 0
    cpu.carry = cpu.y >= val ? 1 : 0
})

findByName(IName.DEC)(function(cpu) {
    updateAddr(cpu, this.addrMode, (val)=>{
        val--
        cpu.negative = getBit(val, 7)
        cpu.zero = (val & 0xFF) == 0
        return val
    })
})

findByName(IName.DEX)(function(cpu) {
    let result = cpu.x - 1
    cpu.x = result & 0xFF
    cpu.negative = getBit(result, 7)
    cpu.zero = result === 0
})

findByName(IName.DEY)(function(cpu) {
    let result = cpu.y - 1
    cpu.y = result & 0xFF
    cpu.negative = getBit(result, 7)
    cpu.zero = (result & 0xFF) === 0
})

findByName(IName.EOR)(function(cpu) {
    let val = readAddr(cpu, this.addrMode)
    let result = cpu.acc ^ val
    cpu.acc = result & 0xFF
    cpu.negative = getBit(result, 7)
    cpu.zero = (0xFF & result) === 0
})

findByName(IName.INC)(function(cpu) {
    updateAddr(cpu, this.addrMode, (val) => {
        val++
        cpu.negative = getBit(val, 7)
        cpu.zero = (0xFF & val) === 0
        return val
    })
})

findByName(IName.INX)(function(cpu) {
    let result = cpu.x + 1
    cpu.x = result & 0xFF
    cpu.negative = getBit(result, 7)
    cpu.zero = (result & 0xFF)=== 0
})

findByName(IName.INY)(function(cpu) {
    let result = cpu.y + 1
    cpu.y = result & 0xFF
    cpu.negative = getBit(result, 7)
    cpu.zero = (result & 0xFF) === 0
})

findByName(IName.JMP)(function(cpu) {
    cpu.pc = getAddr(cpu, this.addrMode) & 0xFFFF
})

findByName(IName.JSR)(function(cpu) {
    let val = getAddr(cpu, this.addrMode)
    cpu.pc--
    cpu.push( (cpu.pc>>8) & 0xFF)
    cpu.push( cpu.pc & 0xFF )
    cpu.pc = val & 0xFFFF
})

findByName(IName.LDA)(function(cpu, addr, extraCycle) {
    let result = readAddr(cpu, this.addrMode)
    cpu.acc = result & 0xFF
    cpu.negative = getBit(result, 7)
    cpu.zero = (result & 0xFF) === 0
})

findByName(IName.LDX)(function(cpu, addr, extraCycle) {
    let result = readAddr(cpu, this.addrMode)
    cpu.x = result & 0xFF
    cpu.negative = getBit(result, 7)
    cpu.zero = (0xFF & result) === 0
})

findByName(IName.LDY)(function(cpu, addr, extraCycle) {
    let result = readAddr(cpu, this.addrMode)
    cpu.y = result & 0xFF
    cpu.negative = getBit(result, 7)
    cpu.zero = (result & 0xFF) === 0
})

findByName(IName.LSR)( function(cpu, addr){
    updateAddr(cpu, this.addrMode, (val) => {
        let result = val >> 1
        cpu.negative = 0
        cpu.zero = (0xFF & result) === 0
        cpu.carry = (val & 0x1)
        return result
    })
})

findByName(IName.NOP)(() => {

})

findByName(IName.ORA)(function(cpu) {
    let val = readAddr(cpu, this.addrMode)
    let result = (cpu.acc | val) & 0xFF
    cpu.acc = result
    cpu.negative = getBit(result, 7)
    cpu.zero = (0xFF & result) === 0
})

findByName(IName.PHA)( (cpu) => {
    cpu.push(cpu.acc)
})

findByName(IName.PHP)( (cpu) => {
    cpu.brk = 1
    cpu.unused = 1
    cpu.push(cpu.s)
} )

findByName(IName.PLA)( (cpu) => {
    let result = cpu.pop() 
    cpu.acc = result & 0xFF
    cpu.negative = getBit(result, 7)
    cpu.zero = (0xFF & result) === 0
} )

findByName(IName.PLP)( (cpu) => {
    cpu.s = cpu.pop()
} )


findByName(IName.ROL)( function(cpu) {
    updateAddr(cpu, this.addrMode, (val)=>{
        let result = (val << 1) | cpu.carry
        cpu.negative = getBit(result, 7)
        cpu.zero = (0xFF & result) === 0
        cpu.carry = result & 0x100
        return result
    })
} )

findByName(IName.ROR)( function(cpu) {
    updateAddr(cpu, this.addrMode, (val)=>{
        let temp = cpu.carry ? 0x80 : 0x00
        let result = (val >> 1) | temp
        cpu.negative = getBit(result, 7)
        cpu.zero = (0xFF & result) === 0
        cpu.carry = (val & 0x01) === 0 ? 0 : 1
        return result
    })
})


findByName(IName.RTI)( (cpu) => {
    cpu.s = cpu.pop()
    cpu.pc = cpu.pop() | (cpu.pop() << 8)
    cpu.pc &= 0xFFFF
})

findByName(IName.RTS)( (cpu) => {
    let low = cpu.pop() 
    let high = cpu.pop()
    cpu.pc =  high << 8 | low
    cpu.pc++
    cpu.pc &= 0xFFFF
})

findByName(IName.SBC)( function(cpu)  {
    const acc = cpu.acc
    let val = readAddr(cpu, this.addrMode)
    const c = cpu.carry ? 0 : 1
    let result = acc - val - c
    cpu.acc = result & 0xFF
    cpu.negative = getBit(result, 7)
    cpu.zero = (0xFF & result) === 0
    
    if (acc >= (val + c)) {
        cpu.carry = 1
    } else {
        cpu.carry = 0
    }

    if(((acc ^ result) & 0x80) && ((acc ^ val) & 0x80)) {
        cpu.overflow = 1
    } else {
        cpu.overflow = 0
    }
} )

findByName(IName.SEC)( (cpu) => {
    cpu.carry = 1
})

findByName(IName.SED)( (cpu) => {
    cpu.decimal = 1
})

findByName(IName.SEI)( (cpu) => {
    cpu.nmiOnly = 1
})

findByName(IName.STA)( function(cpu) {
    writeAddr(cpu, this.addrMode, cpu.acc)
})

findByName(IName.STX)( function(cpu) {
    writeAddr(cpu, this.addrMode, cpu.x)
} )

findByName(IName.STY)( function(cpu) {
    writeAddr(cpu, this.addrMode, cpu.y)
} )

findByName(IName.TAX)( (cpu) => {
    cpu.x = cpu.acc & 0xFF
    cpu.negative = getBit(cpu.acc, 7)
    cpu.zero =  cpu.x === 0
} )

findByName(IName.TAY)( (cpu) => {
    cpu.y = cpu.acc & 0xFF
    cpu.negative = getBit(cpu.acc, 7)
    cpu.zero =  cpu.y === 0
})

findByName(IName.TSX)( (cpu) => {
    cpu.x = cpu.sp
    cpu.negative = getBit(cpu.x, 7)
    cpu.zero = (0xFF & cpu.x) === 0
})

findByName(IName.TXS)( (cpu) => {
    cpu.sp = cpu.x & 0xFF
})

findByName(IName.TXA)( (cpu) => {
    cpu.acc = cpu.x
    cpu.negative = getBit(cpu.x, 7)
    cpu.zero = (cpu.x & 0xFF) === 0
})

findByName(IName.TYA)( (cpu) => {
    cpu.acc = cpu.y
    cpu.negative = getBit(cpu.y, 7)
    cpu.zero = (0xFF & cpu.y) === 0    
})



export default InstructionManager
export {AddrMode, IName}