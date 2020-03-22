/**
 * Tabbed  
 * Relateively easy tabbed content, powered by CSS
 */
export class Tabbed {

    private config: TabbedConfig;

    constructor(config: TabbedConfig) {
        this.config = config;
    }

    public create() {
        let _self = this;
        let $container = $("<re-tab-container>");

        let $tabGroup = $("<re-tab-group>");

        this.config.content.forEach(function (entry, index) {
            $("<input>")
                .attr("name", _self.config.name)
                .attr("type", "radio")
                .attr("id", "tab-" + _self.config.name + "-" + index)
                .addClass("re-tab-input")
                .appendTo($tabGroup);
            $("<label>")
                .attr("for", "tab-" + _self.config.name + "-" + index)
                .addClass("re-tab-label")
                .html(entry.name)
                .appendTo($tabGroup);
            $("<div>")
                .addClass("re-tab-panel")
                .append(entry.page)
                .appendTo($tabGroup);
        });

        $tabGroup.find("input").first().attr("checked", "checked");

        $container.append($tabGroup);
        return $container;
    }

}

interface TabbedConfig {
    name: string,
    content: TabContent[],
}

export interface TabContent {
    /** Tab name. If there is only one tab, does nothing. */
    name: string,
    /** JQuery element with the modal contents */
    page: JQuery<HTMLElement>,
    /** If true, strips the top margins so that a Tabbed object could be fitted in it */
    tabbable?: boolean,
}
