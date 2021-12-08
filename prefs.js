'use strict';

const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const GLib = imports.gi.GLib;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const freeForm = Gtk.InputPurpose.FREE_FORM;
const gtkEntryOptions = { input_purpose: freeForm, hexpand: true, visible: true };
const gioBindFlags = Gio.SettingsBindFlags.DEFAULT;


function init() { }

function buildPrefsWidget() {

    this._settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.surf');

    // Create a parent widget that we'll return from this function
    let prefsWidget = new Gtk.Grid({ margin: 18, column_spacing: 12, row_spacing: 12, visible: true });

    // Add a simple title and add it to the prefsWidget
    const titleText = `<b>${Me.metadata.name} Preferences:</b>`;
    let title = new Gtk.Label({ label: titleText, halign: Gtk.Align.START, use_markup: true, visible: true });
    prefsWidget.attach(title, 0, 0, 2, 1);

    // Create a label & switch for `triggers`
    let triggersLabel = new Gtk.Label({ label: '<b>Triggers:</b>', halign: Gtk.Align.START, use_markup: true, visible: true });
    prefsWidget.attach(triggersLabel, 0, 1, 1, 1);
    let triggersEntry = new Gtk.Entry(gtkEntryOptions);
    prefsWidget.attach(triggersEntry, 1, 1, 1, 1);
    this._settings.bind("triggers", triggersEntry, "text", gioBindFlags);
    const triggersTips = '<i>Comma-separated values.\nSpaces are ignored.</i>';
    let triggersHelpLabel = new Gtk.Label({ label: triggersTips, halign: Gtk.Align.START, use_markup: true, visible: true });
    prefsWidget.attach(triggersHelpLabel, 0, 2, 1, 1);

    let emptyLabel1 = new Gtk.Label({ label: '', halign: Gtk.Align.START, visible: true });
    prefsWidget.attach(emptyLabel1, 0, 3, 1, 1);

    // Create a label & switch for `search-url`
    let searchUrlLabel = new Gtk.Label({ label: '<b>Search URL:</b>', halign: Gtk.Align.START, use_markup: true, visible: true });
    prefsWidget.attach(searchUrlLabel, 0, 4, 1, 1);
    let searchUrlEntry = new Gtk.Entry(gtkEntryOptions);
    prefsWidget.attach(searchUrlEntry, 1, 4, 1, 1);
    this._settings.bind("search-url", searchUrlEntry, "text", gioBindFlags);
    const searchUrlTips = '<i>Change to use another search engine.</i>';
    let searchUrlHelpLabel = new Gtk.Label({ label: searchUrlTips, halign: Gtk.Align.START, use_markup: true, visible: true });
    prefsWidget.attach(searchUrlHelpLabel, 0, 5, 1, 1);

    // At the time buildPrefsWidget() is called, the window is not yet prepared
    // so if you want to access the headerbar you need to use a small trick
    GLib.idle_add(GLib.PRIORITY_DEFAULT, () => {
        // In GTK4 (GNOME 40), call `get_root()` instead of `get_toplevel()`
        let window = prefsWidget.get_toplevel();
        let headerBar = window.get_titlebar();
        headerBar.title = `${Me.metadata.name} Extension Preferences`;

        return GLib.SOURCE_REMOVE;
    });

    // Return our widget which will be added to the window
    return prefsWidget;
}
