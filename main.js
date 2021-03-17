// part of code for reading local SDFs.
// Borrowed heavily from https://veamospues.wordpress.com/2014/01/27/reading-files-with-angularjs
// Named as attribute value by file input tag in html, called by directive named in input tag.
var all_sdf_tags = [];
var mol_tagged_data = [];
var sdf_mols = [];
var mol_counter = 0;
var step_size = 10;

parseSDF = function($fileContent){
    var sdf_records = split_sdf($fileContent);
    mol_tagged_data = sdf_records.tagged_data;
    sdf_mols = sdf_records.mol_records;
};

// take an SDF and split it into arry of individual MOL records, and array
// of objects containing tagged data
split_sdf = function(sdf_contents){
    var mol_records = [];
    var tagged_data = [];

    sdf_contents = sdf_contents.replace(/\r?\n/g, '\n');
    var sdf_lines = sdf_contents.split( /\r?\n/g );
    var sdf_lines = sdf_contents.split( '\n' );
    // console.log("Number of lines " + sdf_lines.length);
    next_mol = [];
    var mol_num = 1;
    if (-1 == all_sdf_tags.indexOf('Number')){
        all_sdf_tags.push('Number');
    }
    
    for (i = 0; i < sdf_lines.length; i++){
        next_mol.push(sdf_lines[i]);
        if (sdf_lines[i].trim() == 'M  END'){
            // end of MOL record, so extract some into if available, save it
            // and reset
            var mol_td = {Number: mol_num};
            if (next_mol[0].trim().length > 0){
                mol_td.Name = next_mol[0].trim();
                if (-1 == all_sdf_tags.indexOf('Name')){
                    all_sdf_tags.push('Name');
                }
            }
            // line 2 of the record may have dimension info (2D or 3D).
            // Assume 2D if not present.
            if (next_mol[1].length >= 21 && '3D' == next_mol[1].substr(20, 2)){
                mol_td.Dimension = 3;
            } else {
                mol_td.Dimension = 2;
            }
            mol_records.push(next_mol.join('\n'));
            next_mol = [];
            mol_num++;

            // there may be some tagged data if it's an SDF
            for (; i < sdf_lines.length; i++){
                if (sdf_lines[i].trim() == '$$$$'){
                    break;
                }
                // the CTFile docs from BioVia say that if a line starts
                // with >, it's tagged data, the tag starts at the next >
                // and finishes at the < after that. There can be any text
                // in between.
                if ('>' === sdf_lines[i].charAt(0)){
                    var tag = sdf_lines[i].substr(1);
                    var ts = tag.indexOf('<');
                    // if ts is -1, there's no start for the tag name, so
                    // the line is corrupt. Just skip for now.
                    if (-1 != ts){
                        tag = tag.substr(ts + 1);
                        var tse = tag.indexOf('>');
                        if (-1 != tse){
                            tag = tag.substr(0, tse);
                            var data = '';
                            i++;
                            var num_dl = 0;
                            for (; i < sdf_lines.length; i++){
                                var nl = sdf_lines[i].trim();
                                if (0 == nl.length || nl == '$$$$'){
                                    break;
                                }
                                num_dl++;
                                data += sdf_lines[i];
                            }
                            // in principle the data can be on multiple
                            // lines ending with a blank line. In practice,
                            // these will make the table very ugly, so don't
                            // include them. They are unlikely to be helpful
                            // in this context.
                            if (1 == num_dl){
                                if (-1 == all_sdf_tags.indexOf(tag)){
                                    all_sdf_tags.push(tag);
                                }
                                mol_td[tag] = data;
                            } else {
                                console.log('skipping ' + tag);
                            }
                        }
                    }
                }
            }
            // we've read all the tagged data for this molecule
            // console.log("final mol_td : " + JSON.stringify(mol_td));
            tagged_data.push(mol_td);
        }
    }
    //for (i=0; i<all_sdf_tags.length; i++){ console.log(all_sdf_tags[i]); }

    return { mol_records: mol_records, tagged_data: tagged_data };
};

var tabulate = function(){
    var columns = Object.keys(mol_tagged_data[0]);
    var data = mol_tagged_data.slice(mol_counter, mol_counter+step_size);

    var table = d3.select('#table');
    d3.select('#table thead').remove();
    d3.select('#table tbody').remove();
    var thead = table.append('thead');
    var tbody = table.append('tbody');

    thead.append('tr')
        .selectAll('th')
        .data(columns)
        .enter()
        .append('th')
            .text(function(d){ return d; });

    var rows = tbody.selectAll('tr')
        .data(data)
        .enter()
            .append('tr');

    var cells = rows.selectAll('td')
        .data(function(row){
            return columns.map(function(column){
                return { column: column, value: row[column] };
            });
        })
        .enter()
        .append('td')
        .text(function(d){ return d.value; })
        .attr('class', (d, i) => 'col_'+i);

    thead.selectAll('tr').append('th').text('Struture');
    rows.append('td')
        .append('canvas')
        .attr('id', (d, i) => 'viewer_'+i);

    if (2 === mol_tagged_data[mol_counter].Dimension){
        for (i=0; i<step_size && i<data.length; i++){
            var mol = ChemDoodle.readMOL(sdf_mols[mol_counter+i]);
            var viewer = new ChemDoodle.ViewerCanvas('viewer_'+i, 110, 110);
            viewer.styles.atoms_useJMOLColors = true;
            viewer.loadMolecule(mol);
        }
    }
}

$(document).ready(function(){
    var url = 'https://raw.githubusercontent.com/taneishi/SDFViewer/master/data/train_rand_data.sdf'; 
    d3.text(url).then(function(text){
        parseSDF(text);
        tabulate();
        //console.log("Number of molecules " + sdf_mols.length);
        //console.log("Number of tagged data records " + mol_tagged_data.length);
    });

    $('#inputFile').on('change', function(){ 
        mol_counter = 0;
        var file = $(this).prop('files')[0];
        if (file){
            var url = URL.createObjectURL(file);
            d3.text(url).then(function(text){
                parseSDF(text);
                tabulate();
            });
        }
    });

    $('#first').on('click', function(){
        mol_counter = 0;
        tabulate();
    });

    $('#next').on('click', function(){
        if (mol_counter < sdf_mols.length - step_size){
            mol_counter += step_size;
            tabulate();
        }
    });

    $('#prev').on('click', function(){
        if (mol_counter >= step_size){
            mol_counter -= step_size;
            tabulate();
        }
    });

    $('#last').on('click', function(){
        mol_counter = Math.floor((sdf_mols.length - 1) / step_size) * step_size;
        tabulate();
    });

});

