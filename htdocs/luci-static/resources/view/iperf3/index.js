'use strict';
'require view';
'require form';
'require fs';
'require ui';
'require uci';

return view.extend({
    load: function() {
        return fs.exec_direct('/usr/bin/iperf3', ['--version']);
    },

    render: function(version) {
        var m, s, o;

        m = new form.Map('iperf3', _('iPerf3'), _('This is the iPerf3 configuration page.'));

        s = m.section(form.TypedSection, 'iperf3', _('Settings'));
        s.anonymous = true;

        o = s.option(form.Value, 'server', _('Server'), _('The iPerf3 server to connect to.'));
        o.datatype = 'host';
        
        o = s.option(form.Value, 'port', _('Port'), _('The port to use for the iPerf3 connection.'));
        o.datatype = 'port';
        o.placeholder = '5201';

        o = s.option(form.Value, 'duration', _('Duration'),
            _('Length of the test in seconds.'));
        o.datatype = 'range(1,300)';
        o.placeholder = '10';

        o = s.option(form.Flag, 'reverse', _('Reverse'), _('Run in reverse mode.'));
        o.default = o.disabled;

        o = s.option(form.Flag, 'enabled', _('Enable Server'),
            _('Allow the managed iPerf3 server to run.'));
        o.default = o.disabled;

        o = s.option(form.Value, 'bind', _('Server Bind Address'),
            _('Address on which the iPerf3 server should listen.'));
        o.datatype = 'ipaddr';
        o.placeholder = '0.0.0.0';

        // Add a button to start the iperf3 test
        o = s.option(form.Button, '_start', _('Start Client Mode'));
        o.inputtitle = _('Start iPerf3 Client');
        o.onclick = this.handleStartTest;

        // Add a button to start the iperf3 server
        o = s.option(form.Button, '_start_server', _('Start Server Mode'));
        o.inputtitle = _('Start iPerf3 Server');
        o.onclick = this.handleStartServer;

        // Add a button to stop the iperf3 server
        o = s.option(form.Button, '_stop_server', _('Stop iperf3'));
        o.inputtitle = _('Stop iPerf3 Server');
        o.onclick = this.handleStopServer;

        // Add a placeholder for the results and testing
        //var se = uci.get_first('iperf3', 'iperf3', 'server');
        //o = s.option(form.DummyValue, '_results', _(se));
        //o.textvalue = 'test';
        

        return m.render();
    },

    handleStartTest: function() {
        var server = uci.get_first('iperf3', 'iperf3', 'server');
        var port = uci.get_first('iperf3', 'iperf3', 'port') || '5201';        var duration = uci.get_first('iperf3', 'iperf3', 'duration') || '10';
        var reverse = uci.get_first('iperf3', 'iperf3', 'reverse') === '1';
        var args = ['-c', server, '-p', port, '-t', duration];

        if (reverse)
            args.push('-R');
        
        var modalContent = ui.showModal(_('iPerf3 Test Results'), [E('div', { 'class': 'cbi-section' }),
            E('p', _('running... Will take a bit...')),
            E('button', {
                'class': 'btn',
                'click': function() {
                    ui.hideModal();
                }
            }, _('Dismiss'))
            ]);
        
            fs.exec('/usr/bin/iperf3', args).then(function(res) {
                if (res.code === 0 && res.stdout && res.stdout.length > 0) {
                    modalContent.removeChild(modalContent.lastChild);
                    modalContent.removeChild(modalContent.lastChild);
                    modalContent.appendChild(E('pre', [res.stdout]));
                    modalContent.appendChild(E('button', {
                        'class': 'btn',
                        'click': function() {
                            ui.hideModal();
                        }
                    }, _('Dismiss')));
                }
                else {
                    var errorOutput = res.stderr || res.stdout ||
                        _('No output was returned by iPerf3.');

                    modalContent.removeChild(modalContent.lastChild);
                    modalContent.removeChild(modalContent.lastChild);
                    modalContent.appendChild(E('p', [
                        _('iPerf3 test failed with exit code %s.').format(res.code)
                    ]));
                    modalContent.appendChild(E('pre', [errorOutput]));
                    modalContent.appendChild(E('button', {
                        'class': 'btn',
                        'click': function() {
                            ui.hideModal();
                        }
                    }, _('Dismiss')));
                }
            })
            .catch(function(err) {
                modalContent.removeChild(modalContent.lastChild);
                modalContent.removeChild(modalContent.lastChild);
                modalContent.appendChild(E('p', [
                    _('Unable to execute iPerf3.')
                ]));
                modalContent.appendChild(E('pre', [
                    err.message || String(err)
                ]));
                modalContent.appendChild(E('button', {
                    'class': 'btn',
                    'click': function() {
                        ui.hideModal();
                    }
                }, _('Dismiss')));
            });
    },


    handleStartServer: function() {
        fs.exec('/etc/init.d/iperf3-luci', ['start']).then(function(res) {
            if (res.code === 0) {
                ui.addNotification(null,
                    _('Managed iPerf3 server started successfully'), 'info');
            }
            else {
                ui.addNotification(null,
                    _('Failed to start iPerf3 server: ') +
                    (res.stderr || res.stdout || _('Unknown error')), 'error');
            }
        }).catch(function(err) {
            ui.addNotification(null,
                _('Failed to start iPerf3 server: ') +
                (err.message || String(err)), 'error');
        });
    },

    handleStopServer: function() {
        fs.exec('/etc/init.d/iperf3-luci', ['stop']).then(function(res) {
            if (res.code === 0) {
                ui.addNotification(null,
                    _('Managed iPerf3 server stopped successfully'), 'info');
            }
            else {
                ui.addNotification(null,
                    _('Failed to stop iPerf3 server: ') +
                    (res.stderr || res.stdout || _('Unknown error')), 'error');
            }
        }).catch(function(err) {
            ui.addNotification(null,
                _('Failed to stop iPerf3 server: ') +
                (err.message || String(err)), 'error');
        });
    }
});

