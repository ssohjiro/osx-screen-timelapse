#!/usr/bin/env sh
 
# seconds between image captures
CAPTURE_RATE=3
 
#number of monitors to capture
NUM_SCREENS=2
 
capture_loop (){
 
    scrns_string () {
        local ti=0
        local outp=""
 
        while [ $ti -lt ${NUM_SCREENS} ]
        do
            outp="${outp} ${1}_m${ti}.png"
            (( ti++ ))
        done
        echo $outp
    }
 
    #fast forwards to largest numbered dump file in PWD
    i=0
 
    PREVIOUS=`ls  *_merged.png`
    for fn in $PREVIOUS
    do
        if [ ! -f "${i}_merged.png" ]
        then
            echo "${i}_merged.png"
            break
        fi
            (( i++ ))
    done
 
    echo "numbering from ${i}"
	scrns_string ff
}

capture_loop
