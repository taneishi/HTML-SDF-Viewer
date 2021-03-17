# Javascript SDF Viewer

This is a small web app that allows the user to examine the contents of a 2D or 3D SDF in a browser.
Any tagged data records are tabulated and displayed alongside the molecule view for ease of reference.
The purpose is to provide a consistent interface for this simple tool across any browser/OS combination.
It is known to work on Linux, MacOS, and Windows 10 with Firefox, Chrome, Safari and Edge.
It needs no web connection, all the 3rd party components being in the download.

In order to keep it simple and entirely self-contained, it uses whatever coordinates are in the SDF.
It assumes 2D coordinates by default, displayed in JSME or ChemDoodleWeb in display (as opposed to edit) mode, 
but if the relevant flag is set in the SDF (characters 20 and 21 of line 2 of the MOL record) 
it will use 3Dmol.js to display the 3D coordinates instead.

## Usage

Open the file index.html in a browser and load an SDF using the 'Browse' button in the web page.

If viewing a 2D file, the JSME viewer provides some extra
functionality - right-clicking in the window brings up a context menu
allowing the copying to the clipboard of the molecule structure in
various formats (SMILES, InChI key, etc.) and also the possibility of
performing a Google search using the InChI key.

If the formatting of the 3D browser (if viewing a 3D SDF) or the table
looks a bit odd (headers not aligned with columns, for example) try tweaking the width of the browser window.
This forces a recalculation of the layout and usually fixes things.  It's crude, but seems to work.
I am trying to find out why this happens in order to fix it.

There are some relevant files in the data directory of the download if you want to try it on public data.

## Environment

- jQuery-3.6.0
- D3.js-v6 
- ChemDoodleWeb-9.2.0
- Firefox-86.0

## Copyright

Copyright David Cosgrove, CozChemIx Limited, 2017.
Copyright Kei Taneishi, 2019-2021.

Licensed under the BSD license - see LICENSE for details.
