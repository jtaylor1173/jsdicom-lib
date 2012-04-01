/**
* Copyright 2012 Infogosoft
*
* This file is part of jsdicom.
*
* jsdicom is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
*
* jsdicom is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License along with jsdicom. If not, see http://www.gnu.org/licenses/.
*/
// read vr(both little and big endian)
function read_vr(buffer, offset) {
    return String.fromCharCode(buffer[offset]) + 
           String.fromCharCode(buffer[offset+1]);
}


// Big endian readers
function read_number_BE(buffer, offset, length) {
    var n = 0;
    for(var i=offset;i<offset+length;++i) {
        n = n*256 + buffer[i];
    }
    return n;
}

function read_tag_BE(buffer, offset) {
    var tag = buffer[offset]*256*256*256 + buffer[offset+1]*256*256 +
              buffer[offset+2]*256 + buffer[offset+3];
    return tag;
}

// Little endian readers
function read_number_LE(buffer, offset, length) {
    var it = offset + length - 1;
    var n = 0;
    for(;it>=offset;--it) {
        var tmp = buffer[it];
        n = n*256 + buffer[it];
    }
    return n;
}

function read_tag_LE(buffer, offset) {
    var tag = buffer[offset+1]*256*256*256 + buffer[offset]*256*256 +
              buffer[offset+3]*256 + buffer[offset+2];
    return tag;
}

function element_reader(tag_reader, number_reader, implicit) {
    this._read_tag = tag_reader;
    this._read_number = number_reader;

    // reads a data element and returns the new offset
    this.read_element = function(buffer, offset, element /* out */) {
        var tag = this._read_tag(buffer, offset)
        offset += 4;
        
        var vl;
        var vr;
        if (tag == 0xfffee000 || tag == 0xfffee00d || tag == 0xfffee0dd) {
            // Item delimiters
            element.tag = tag;
            element.vl = this._read_number(buffer, offset, 4);
            offset += 4;
            element.vr = "N/A";
            return offset;
        }
            
        if(implicit) {
            vr = "UN";
            if(tag in dcmdict) {
                vr = dcmdict[tag][0];
            }
            
            vl = this._read_number(buffer, offset, 4);
            offset += 4;
        } else {
            vr = read_vr(buffer, offset);
            if(vr == "OB" || vr == "OF" || vr == "SQ" || vr == "OW" || vr == "UN") { 
                offset += 4;
                vl = this._read_number(buffer, offset, 4);
                offset += 4;
            } else {
                offset += 2;
                vl = this._read_number(buffer, offset, 2);
                offset += 2;
            }
        }
        
        element.tag = tag;
        element.vr = vr;
        if (vl == 0xffffffff)
            element.vl = 0;
        else
            element.vl = vl;

        if(element.vr == "SQ") {
            element.sequence_items = [];
            var itemstart = new DataElement(implicit);
            var seq_offset = this.read_element(buffer, offset, itemstart); // Item start

            if(itemstart.vl == 0xffffffff) { // Implicit length
                var item = new DataElement(implicit);
                var seq_offset = this.read_element(buffer, seq_offset, item); // Item start
                while(item.tag != 0xfffee0dd) { // Sequence delimiter
                    if(item.tag != 0xfffee00d) {
                        element.sequence_items.push(item);
                    }
                    var item = new DataElement(implicit);
                    var seq_offset = this.read_element(buffer, seq_offset, item); // Item start
                }
                element.vl = seq_offset-offset;
            } else { // Explicit length, no sequence delimiter(?)
                while(seq_offset < offset + element.vl) {
                    var item = new DataElement(implicit);
                    seq_offset = this.read_element(buffer, seq_offset, item);
                    element.sequence_items.push(item);
                }
            }
        }

        element.data = buffer.subarray(offset, offset + element.vl);
        element.implicit = implicit;
        offset += element.vl;
        return offset;
    }
}

transferSyntaxes = {
    "LittleEndianImplicit": "1.2.840.10008.1.2",
    "LittleEndianExplicit": "1.2.840.10008.1.2.1",
    "BigEndianExplicit": "1.2.840.10008.1.2.2",
    "DeflatedLittleEndianExplicit": "1.2.840.10008.1.2.1.99"
}

tag_readers = {
    "1.2.840.10008.1.2": read_tag_LE,
    "1.2.840.10008.1.2.1": read_tag_LE,
    "1.2.840.10008.1.2.2": read_tag_BE,
    "1.2.840.10008.1.2.4.50": read_tag_LE,
    "1.2.840.10008.1.2.4.51": read_tag_LE,
    "1.2.840.10008.1.2.4.52": read_tag_LE,
    "1.2.840.10008.1.2.4.53": read_tag_LE,
    "1.2.840.10008.1.2.4.54": read_tag_LE,
    "1.2.840.10008.1.2.4.55": read_tag_LE,
    "1.2.840.10008.1.2.4.56": read_tag_LE,
    "1.2.840.10008.1.2.4.57": read_tag_LE,
    "1.2.840.10008.1.2.4.58": read_tag_LE,
    "1.2.840.10008.1.2.4.59": read_tag_LE,
    "1.2.840.10008.1.2.4.60": read_tag_LE,
    "1.2.840.10008.1.2.4.61": read_tag_LE,
    "1.2.840.10008.1.2.4.62": read_tag_LE,
    "1.2.840.10008.1.2.4.63": read_tag_LE,
    "1.2.840.10008.1.2.4.64": read_tag_LE,
    "1.2.840.10008.1.2.4.65": read_tag_LE,
    "1.2.840.10008.1.2.4.66": read_tag_LE,
    "1.2.840.10008.1.2.4.70": read_tag_LE,
    "1.2.840.10008.1.2.4.80": read_tag_LE,
    "1.2.840.10008.1.2.4.81": read_tag_LE,
    "1.2.840.10008.1.2.4.90": read_tag_LE,
    "1.2.840.10008.1.2.4.91": read_tag_LE,
    "1.2.840.10008.1.2.4.92": read_tag_LE,
    "1.2.840.10008.1.2.4.93": read_tag_LE,
}

is_implicit = {
    "1.2.840.10008.1.2": true,
    "1.2.840.10008.1.2.1": false,
    "1.2.840.10008.1.2.2": false,
    "1.2.840.10008.1.2.4.50": false,
    "1.2.840.10008.1.2.4.51": false,
    "1.2.840.10008.1.2.4.52": false,
    "1.2.840.10008.1.2.4.53": false,
    "1.2.840.10008.1.2.4.54": false,
    "1.2.840.10008.1.2.4.55": false,
    "1.2.840.10008.1.2.4.56": false,
    "1.2.840.10008.1.2.4.57": false,
    "1.2.840.10008.1.2.4.58": false,
    "1.2.840.10008.1.2.4.59": false,
    "1.2.840.10008.1.2.4.60": false,
    "1.2.840.10008.1.2.4.61": false,
    "1.2.840.10008.1.2.4.62": false,
    "1.2.840.10008.1.2.4.63": false,
    "1.2.840.10008.1.2.4.64": false,
    "1.2.840.10008.1.2.4.65": false,
    "1.2.840.10008.1.2.4.66": false,
    "1.2.840.10008.1.2.4.70": false,
    "1.2.840.10008.1.2.4.80": false,
    "1.2.840.10008.1.2.4.81": false,
    "1.2.840.10008.1.2.4.90": false,
    "1.2.840.10008.1.2.4.91": false,
    "1.2.840.10008.1.2.4.92": false,
    "1.2.840.10008.1.2.4.93": false
}

is_little_endian = {
    "1.2.840.10008.1.2": true,
    "1.2.840.10008.1.2.1": true,
    "1.2.840.10008.1.2.2": false
};

number_readers = {
    "1.2.840.10008.1.2": read_number_LE,
    "1.2.840.10008.1.2.1": read_number_LE,
    "1.2.840.10008.1.2.2": read_number_BE,
    "1.2.840.10008.1.2.4.50": read_number_LE,
    "1.2.840.10008.1.2.4.51": read_number_LE,
    "1.2.840.10008.1.2.4.52": read_number_LE,
    "1.2.840.10008.1.2.4.53": read_number_LE,
    "1.2.840.10008.1.2.4.54": read_number_LE,
    "1.2.840.10008.1.2.4.55": read_number_LE,
    "1.2.840.10008.1.2.4.56": read_number_LE,
    "1.2.840.10008.1.2.4.57": read_number_LE,
    "1.2.840.10008.1.2.4.58": read_number_LE,
    "1.2.840.10008.1.2.4.59": read_number_LE,
    "1.2.840.10008.1.2.4.60": read_number_LE,
    "1.2.840.10008.1.2.4.61": read_number_LE,
    "1.2.840.10008.1.2.4.62": read_number_LE,
    "1.2.840.10008.1.2.4.63": read_number_LE,
    "1.2.840.10008.1.2.4.64": read_number_LE,
    "1.2.840.10008.1.2.4.65": read_number_LE,
    "1.2.840.10008.1.2.4.66": read_number_LE,
    "1.2.840.10008.1.2.4.70": read_number_LE,
    "1.2.840.10008.1.2.4.80": read_number_LE,
    "1.2.840.10008.1.2.4.81": read_number_LE,
    "1.2.840.10008.1.2.4.90": read_number_LE,
    "1.2.840.10008.1.2.4.91": read_number_LE,
    "1.2.840.10008.1.2.4.92": read_number_LE,
    "1.2.840.10008.1.2.4.93": read_number_LE
}

// Element reader factory
// All transfer syntaxes for encapsulation of encoded pixel data uses Explicit VR Little endian (11_05 A4)
function get_element_reader(transfersyntaxUID) {
    if(transfersyntaxUID in tag_readers && transfersyntaxUID in number_readers) {
        return new element_reader(tag_readers[transfersyntaxUID],
                                  number_readers[transfersyntaxUID],
                                  is_implicit[transfersyntaxUID])
    }
    return;
}

meta_element_reader = get_element_reader("1.2.840.10008.1.2.1");
