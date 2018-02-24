const getBit = (bits, index) => {
    return (bits >> index) & 0x01
}

export default getBit
