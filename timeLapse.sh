#!/usr/bin/env sh
 
# seconds between image captures
CAPTURE_RATE=3
 
#number of monitors to capture
NUM_SCREENS=1
 
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
 
    while true ;
        do
            echo `date`‘ Capturing screenshot...’
            # IMGNAMES="${i}_m1.png ${i}_m2.png"
            IMGNAMES=$(scrns_string $i)
            # run three commands as one in the background to counter drifting
            screencapture -C -x ${IMGNAMES} && \
            `convert ${IMGNAMES} +append ${i}_merged.png` && \
            `rm ${IMGNAMES}` &
            sleep $CAPTURE_RATE
            (( i++ ))
    done
}
 
#combine png images in PWD to movie
make_video (){
 
    sequentialize
 
    SEPTS=""
    if [ -z "$1"]
        then
        SEPTS="5.0"
    else
        SEPTS=$1
    fi
 
    echo "setpts=${SEPTS}*PTS"
 
    ffmpeg -start_number 000001 -i seqtmp_%06d.png -vcodec libx264 -r 30 -b:v 5000k \
         -filter:v "setpts=${SEPTS}*PTS"  timelapse.mp4
    # -s 3840x1200
 
    #remove symlinks
    rm seqtmp_*.png
}
 
# make sorted soft links to images in
# sequential continous order
sequentialize (){
    c=1
    for i in `ls *_merged.png | sort -n`
    do
       printf -v NN 'seqtmp_%06d.png' "$c"
       ln -sf ${i} ${NN}
       (( c++ ))
    done
}
 
# if no arguments given,
if [ -z "$1" ]
then
   capture_loop
elif [ "$1" == "--sequentialize" -o "$1" == "-S" ]
then
    sequentialize
elif [ "$1" == "--video" -o "$1" == "-V" ]
then
    echo "making video"
    if [ -z "$2" ]
    then
        make_video
    else
        make_video $2
    fi
else
 
    echo "Unknown argument: $1"
    echo "Usage $0 [-combine ouputname.mp4]"
fi
