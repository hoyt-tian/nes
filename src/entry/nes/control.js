export const Keys = {
    A:      0,
    B:      1,
    SELECT: 2,
    START:  3,
    UP:     4,
    DOWN:   5,
    LEFT:   6,
    RIGHT:  7,
}

export const KeyCode = {
    W:  0x57,
    S:  0x53,
    A:  0x41,
    D:  0x44,
    N:  0x4E,
    M:  0x4D,
    J:  0x4A,
    K:  0x4B
}

const Kindex = ['A','B','SELECT','START','UP','DOWN','LEFT','RIGHT']

const setKeyStatus = function(keyType, val) {
    switch(keyType) {
        case Keys.UP:
            this.directions.UP = val
            break
        case Keys.DOWN:
            this.directions.DOWN  = val
            break
        case Keys.LEFT:
            this.directions.LEFT = val
            break
        case Keys.RIGHT:
            this.directions.RIGHT = val
            break
        case Keys.A:
            this.buttons.A = val
            break
        case Keys.B:
            this.buttons.B = val
            break
        case Keys.SELECT:
            this.buttons.SELECT = val
            break
        case Keys.START:
            this.buttons.START = val
            break
    }
}

export default class Control {
    constructor() {
        this.data = null
        this.last = 0
        this.directions = {
            UP:false,
            DOWN:false,
            LEFT:false,
            RIGHT:false,
        }

        this.buttons = {
            A:false,
            B:false,
            SELECT:false,
            START:false,
        }

        this.total = 0
    }

    keyDown(keyType) {
        setKeyStatus.call(this, keyType, true)
        if (keyType === Keys.START) window.runtest = true
    }

    keyUp(keyType) {
        setKeyStatus.call(this, keyType, false)
    }

    read() {
        const counter = this.last === 1 ? 0 : this.total++

        if (counter >= 8) return 1

        if (this.directions[Kindex[counter]] || this.buttons[Kindex[counter]]) {
            return 1
        }

        return 0
    }

    write(val) {
        this.data = val

        if (val & 0x01)  this.total = 0

        this.last = val
    }
}