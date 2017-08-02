//
// Controller for hsvApp
// Copyright David Cogrove, CozChemIx Limited 2017
//  david@cozchemix.co.uk
// Distributed under the BSD license, contained in the file license.txt in
// the same directory as this file.

hsvApp.controller("hsvCtrl", ['$scope', '$window',  function($scope, $window) {
    // The $window variable is needed because jsmeApplet is defined outside
    // of the angularJS code.  Because of the asynchronous way the page is
    // built, this code may be called before the page is finished so we can't
    // reliably take a copy of $window.jsmeApplet for use later, so we'll
    // carry on using it directly.  It doesn't feel right, but that's not its problem.
    $scope.whole_sdf = "";
    $scope.fileContent = "";

    // part of code for reading local SDFs.  Borrowed heavily from
    // https://veamospues.wordpress.com/2014/01/27/reading-files-with-angularjs
    // Named as attribute value by file input tag in html, called by directive named
    // in input tag.
    $scope.parseSDF = function($fileContent) {
	$scope.whole_sdf = $fileContent;
	$scope.sdf_records = split_sdf($scope.whole_sdf);
	$scope.mol_tagged_data = $scope.sdf_records.tagged_data;
	$scope.sdf_mols = $scope.sdf_records.mol_records;
	show_molecule();
    };

    $scope.firstMolCounter = function() {
	$scope.mol_counter = 0 ;
	show_molecule();
    };
    $scope.incrementMolCounter = function(step_size) {
	if($scope.mol_counter < $scope.sdf_mols.length - step_size) {
	    $scope.mol_counter += step_size ;
	    show_molecule();
	}
    };
    $scope.decrementMolCounter = function(step_size) {
	if($scope.mol_counter >= step_size) {
	    $scope.mol_counter -= step_size;
	    show_molecule();
	}
    };
    $scope.lastMolCounter = function() {
	$scope.mol_counter = $scope.sdf_mols.length - 1;
	show_molecule();
    };

    // expects to get the Number value from the mol_tagged_data record.
    $scope.setMolCounter = function(new_val) {
	for(i = 0; i < $scope.mol_tagged_data.length; i++) {
	    if($scope.mol_tagged_data[$scope.mol_index[i]].Number == new_val) {
		$scope.mol_counter = i;
		show_molecule();
		return;
	    }
	}
	
    }

    // sort the mol data according to the given value, maintaining the sense of the
    // next, previous buttons on the sorted data.
    $scope.sortColumn = function(column_name) {
	
	sort_pairs = [];
	var num_nums = 0;
	var num_dates = 0;

	// using moment.js (momentjs.com) for date parsing. Note that in this
	// library, 2 digit years are parsed as 19xx if xx > 68, 20xx if x <= 68.
	// The test files in this download reveal that this is not necessarily a
	// splendid cutoff, but I suppose they have to put it somewhere. I come
	// out as aged -49 on that model.
	var date_formats = [
	    moment.ISO_8601,
	    "MM/DD/YYYY  :)  HH*mm*ss"
	];
	
	for(i = 0; i < $scope.mol_tagged_data.length; i++) {
	    sort_pairs.push({index: $scope.mol_tagged_data[i].Number,
			     data:$scope.mol_tagged_data[i][column_name]});
	    // assess type for the data which will be in strings
	    // because they've come from an SDF.  This gives inadequate sorting
	    // results. Try and convert to floats, if that doesn't work try dates,
	    // and if that doesn't work use strings.
	    // The plus forces conversion to a number, leaving a NaN if it can't
	    // be done.  It's more reliable, according to a man on the Interweb,
	    // than parseInt and parseFloat which will give numbers for 44.png,
	    // for example.
	    if(!isNaN(+$scope.mol_tagged_data[i][column_name])) {
		num_nums++;
	    } else {
		// console.log($scope.mol_tagged_data[i][column_name]);
		if(moment($scope.mol_tagged_data[i][column_name], date_formats, false).isValid()) {
		    num_dates++;
		}
	    }
	}

	var sort_dates = function(a, b) {
	    var m1 = new moment(a.data, date_formats, false);
	    var m2 = new moment(b.data, date_formats, false);
	    if(m1.isBefore(m2)) {
		return -1;
	    } else if(m1.isSame(m2)) {
		return 0;
	    } else {
		return 1;
	    }
	};
	var sort_strings = function(a, b) {
	    if(a.data < b.data) {
		return -1;
	    } else if(a.data == b.data) {
		return 0;
	    } else {
		return 1;
	    }
	};
	
	if(num_nums == $scope.mol_tagged_data.length) {
	    sort_pairs.sort(function(a,b) { return +a.data - +b.data; });
	} else if(num_dates == $scope.mol_tagged_data.length) {
	    sort_pairs.sort(sort_dates);
	} else {
	    sort_pairs.sort(sort_strings);
	}
	if($scope.descending_sort) {
	    sort_pairs.reverse();
	}
	$scope.descending_sort = !$scope.descending_sort;
	
	// console.log(JSON.stringify(sort_pairs));
	$scope.mol_index = [];
	for(i = 0; i < sort_pairs.length; i++) {
	    $scope.mol_index.push(sort_pairs[i].index - 1);
	    show_molecule();
	}
    };

    show_molecule = function() {
	$window.jsmeApplet.readMolFile( $scope.sdf_records.mol_records[$scope.mol_index[$scope.mol_counter]] );
    }

    // take an SDF and split it into arry of individual MOL records, and array
    // of objects containing tagged data
    split_sdf = function(sdf_contents) {

	$scope.all_sdf_tags = [];
	$scope.mol_tagged_data = [];
	$scope.sdf_mols = [];
	$scope.mol_counter = 0;
	$scope.mol_index = [];
	$scope.descending_sort = false;
	
	var mol_records = [];
	var tagged_data = [];

	sdf_contents = sdf_contents.replace(/\r?\n/g, '\n');
	var sdf_lines = sdf_contents.split( /\r?\n/g );
	var sdf_lines = sdf_contents.split( '\n' );
	// console.log( "Number of lines " + sdf_lines.length );
	next_mol = [];
	var mol_num = 1;
	if(-1 == $scope.all_sdf_tags.indexOf('Number')) {
	    $scope.all_sdf_tags.push('Number');
	}
	
	for(i = 0; i < sdf_lines.length; i++) {
	    next_mol.push(sdf_lines[i]);
	    if(sdf_lines[i].trim() == "M  END") {
		// end of MOL record, so extract some into if available, save it
		// and reset
		var mol_td = {Number: mol_num};
		if(next_mol[0].trim().length > 0) {
		    mol_td.Name = next_mol[0].trim();
		    if(-1 == $scope.all_sdf_tags.indexOf('Name')) {
			$scope.all_sdf_tags.push('Name');
		    }
		}
		mol_records.push(next_mol.join('\n'));
		$scope.mol_index.push(mol_num - 1);
		next_mol = [];
		mol_num++;

		// there may be some tagged data if it's an SDF
		for (; i < sdf_lines.length; i++) {
		    if(sdf_lines[i].trim() == "$$$$") {
			break;
		    }
		    if(0 == sdf_lines[i].indexOf('> <')) {
		    	var tag = sdf_lines[i].trim().replace('> <', '').replace('>', '');
			if(-1 == $scope.all_sdf_tags.indexOf(tag)) {
			    $scope.all_sdf_tags.push(tag);
			}
		    	// console.log("Tag : " + tag);
			var data = '';
			i++;
			for(; i < sdf_lines.length; i++) {
			    var nl = sdf_lines[i].trim();
			    if(0 == nl.length || nl == '$$$$') {
				break;
			    }
			    data += sdf_lines[i];
			}
			mol_td[tag] = data;
		    }
		}
		// we've read all the tagged data for this molecule
		// console.log("final mol_td : " + JSON.stringify(mol_td));
		tagged_data.push(mol_td);
	    }
	}
	
	// console.log( "Number of molecules " + mol_records.length );
	// console.log( "Number of tagged data records " + tagged_data.length );
	return { mol_records:mol_records, tagged_data:tagged_data };
    };

}]);
