#!/usr/bin/env node
/*jshint node: true, boss: true, latedef: false, undef: true, devel: true, unused: strict*/

'strict mode';

var _ = require('underscore');
var cli = require('cli');
var argv = cli.parse({
	video: ['v', 'Create Video'],
	septs: ['s', 'septs']
});
var when = require('when');
var syncExec = require('sync-exec');
var cp = require('child_process');
var count = 0;

var CAPTURE_RATE = 5000;

function getNumOfMonitor() {

	var deferred = when.defer();

	cli.exec( 'system_profiler SPDisplaysDataType', function( lines ) {

		var numOfMonitor = 1;

		var idx = _.findIndex( lines, function( line ) {
			return /^      Displays:/.test( line );
		});
		lines = _.rest( lines, idx+1 );

		var isMirror = _.find( lines, function( line ) {
			return /^          Mirror: On/.test( line );
		});

		if( ! isMirror ) {

			var r = _.countBy( lines, function( line ) {
				if( ! line ) return false;
				return ! /^          .*:/.test( line );
			});
			numOfMonitor = r['true'];
		}

		//cli.output('num of monitor: ' + numOfMonitor );
		deferred.resolve( numOfMonitor );
	});

	return deferred.promise;
}

function setInitialCount() {


	var r = syncExec("ls *_merged.png");
	var list = r.stdout.split('\n');
	list.pop();

	list = list.map( function( file ) {
		return Number( file.replace(/_merged\.png$/,'') );
	});

	count = list.length > 0 ? _.max( list ) + 1 : 0;
}

function getFileName( no ) {

	var deferred = when.defer();

	getNumOfMonitor()
	.then( function( monitorLength ) {
		var i, fileNameArg = "";
		for( i=0; i<monitorLength; i++ ) {
			fileNameArg += (no + "_m" + i + ".png ");
		}

		//cli.output( fileNameArg.substr( 0, fileNameArg.length-1) );
		deferred.resolve( fileNameArg.substr( 0, fileNameArg.length-1) );
	});

	return deferred.promise;
}

function screenShot( fileNameArg, no ) {

	cli.exec( 'screencapture -C -x '+fileNameArg+' && \\'+
            'convert '+fileNameArg+' +append '+no+'_merged.png && \\'+
            'rm '+fileNameArg+' &', function() {

		var date = new Date();
		cli.output( no + 'th ' + date.toString() + ' Capturing screenshot...' );
	});
}

function padLeft(nr, n, str){
	return Array(n-String(nr).length+1).join(str||'0')+nr;
}

function sequentialize() {

	var deferred = when.defer();

	cli.exec('ls *_merged.png | sort -n', function( lines ) {

		if( ! lines ) return;
		_.each( lines, function( line, i ) {

			if( ! line ) return;
			console.log( line, i );
			syncExec( 'ln -sf '+line+' seqtmp_'+padLeft( i, 6 )+'.png' );
		});

		deferred.resolve();
	});

	return deferred.promise;
}

if( argv.video ) {

	sequentialize()
	.then( function() {

		cli.output('vedieo!! gogogo');
		var setps = argv.septs || "5.0";
		var outputFile = Date.now() + '.mp4';

		//cli.output( syncExec('ffmpeg -start_number 000001 -i seqtmp_%06d.png -vcodec libx264 -r 30 -b:v 5000k \\'+
			 //'-filter:v "setpts='+setps+'*PTS" '+outputFile ));

		//cp.spawn( 'ffmpeg', [ '-start_number', '000001 -i seqtmp_%06d.png -vcodec libx264 -r 30 -b:v 5000k -filter:v "setpts='+setps+'*PTS" '+outputFile ], {
		cp.spawn( 'ffmpeg', [ '-start_number', '000001', '-i', 'seqtmp_%06d.png', '-vcodec', 'libx264', '-r', '30', '-b:v', '5000k', '-filter:v', 'setpts='+setps+'*PTS', outputFile ], {

			cwd: process.env.PWD,
			stdio: 'inherit'

		}).on( 'exit', function() {

			//resolve();
			syncExec("rm seqtmp_*.png");
			cli.output('vedieo!! end');

			if( argv.deletePng ) {
				var cmd = "rm *_merged.png";
				cli.output( cmd );
				syncExec( cmd );
			}
		});
	});

} else {

	setInitialCount();
	setInterval( function() {

		getFileName( count )
		.then( function( fileNameArgs ) {
			screenShot( fileNameArgs, count );
			count++;
		});

	}, CAPTURE_RATE );
}
