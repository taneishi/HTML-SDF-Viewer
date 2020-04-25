Ext.require(['*']);

ChemDoodle.default_atoms_useJMOLColors = true;

Ext.onReady(function(){
    Ext.QuickTips.init();

    Ext.define('model', {
        extend: 'Ext.data.Model',
        fields: ['pk', 'name', 'maccs', 'score', 'molfile'],
    });

    var store = Ext.create('Ext.data.Store', {
        model: 'model',
        autoLoad: true,
        proxy: {
            type: 'ajax',
            url: 'data/',
            noCache: true,
            reader: { type: 'json', totalProperty: 'total', root: 'items', }
        },
        listeners: {
            load: function(){
                Ext.get('center').select('canvas').each(function(item){
                    var mol = ChemDoodle.readMOL(item.dom.innerHTML);
                    var viewer = new ChemDoodle.ViewerCanvas(item.dom.id, 250, 150);
                    viewer.loadMolecule(mol);
                });
            },
        },
        pageSize: 40,
    });

    var grid = Ext.create('Ext.grid.Panel', {
        region: 'center',
        id: 'center',
        store: store,
        split: true,
        margins: '5 5 5 5',
        columns: [
        { text:'DrugBank ID', width:150, dataIndex:'name' },
        { text:'MACCS', width:300, dataIndex:'maccs' },
        { text:'Structure', width:260, dataIndex:'molfile', renderer:function(value, grid){
            return value ? Ext.String.format('<canvas id="view_{0}">{1}</canvas>', grid.record.data.name, value) : '';
            }
        },
        ],
        dockedItems: [{
            xtype: 'pagingtoolbar',
            store: store,
            dock: 'bottom',
            displayInfo: true,
        }],
        listeners: {
            cellclick:function(e, td, cellIndex, record, tr, rowIndex){
                recommend_store.load({ params:{ pk:record.data.pk } });
            },
        },
    });

    var recommend_store = Ext.create('Ext.data.Store', {
        model: 'model',
        autoLoad: false,
        proxy: {
            type: 'ajax',
            url: 'fingerprint/',
            noCache: true,
            reader: { type: 'json', totalProperty: 'total', root: 'items', }
        },
        listeners: {
            load: function(){
                Ext.get('east').select('canvas').each(function(item){
                    var mol = ChemDoodle.readMOL(item.dom.innerHTML);
                    var viewer = new ChemDoodle.ViewerCanvas(item.dom.id, 250, 150);
                    viewer.loadMolecule(mol);
                });
            },
        },
        pageSize: 40,
    });

    var recommend_grid = Ext.create('Ext.grid.Panel', {
        region: 'east',
        id: 'east',
        width: '45%',
        store: recommend_store,
        split: true,
        margins: '5 5 5 0',
        columns: [
        { xtype: 'rownumberer', width:20, },
        { text:'DrugBank ID', width:150, dataIndex:'name' },
        { text:'Score', width:150, dataIndex:'score' },
        { text:'Structure', width:260, dataIndex:'molfile', renderer:function(value, grid){
            return value ? Ext.String.format('<canvas id="rview_{0}">{1}</canvas>', grid.record.data.name, value) : '';
            }
        },
        ],
        dockedItems: [{
            xtype: 'pagingtoolbar',
            store: recommend_store,
            dock: 'bottom',
            displayInfo: true,
        }],
    });

    var viewport = Ext.create('Ext.Viewport', {
        layout: 'border',
        items: [{
            region: 'north',
            tbar: [{
                xtype: 'tbtext',
                text: 'Molfile Viewer'
            },{ 
                text:'clear',
                listeners:{
                    'click': function(){ Ext.Ajax.request({ url: 'clear/' }); }
                }
            }],
        },
        grid,
        recommend_grid,
        {
            region: 'south',
            bodyStyle: 'text-align:center;',
            bodyPadding: 3,
            html: '2014-' + (new Date).getFullYear() + ' Ext JS version:' + Ext.getVersion(),
        }],
    });
});
