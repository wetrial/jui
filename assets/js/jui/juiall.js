(function () {
    if (typeof define === 'function') {
        define([
            "jui/utils",
            "jui/mixins/compositMixin",
            "jui/mixins/dataMixin",
            "jui/mixins/templateMixin",
            "jui/jcomponent",
            "jui/jtmpl",
            "jui/misc/jpager",
            "jui/misc/jcollapse",

            "jui/layers/jlayer",
            "jui/layers/jpop",
            "jui/layers/jlayer.modal",
            "jui/layers/jlayer.alert",
            "jui/layers/jlayer.tip",

            "jui/utils.ajax",

            "jui/spa",

            "jui/lists/jlist",
            "jui/lists/jlistMenu",
            "jui/lists/jlistTabs",
            "jui/lists/jlistSteps",
            "jui/lists/jlistGrid",
            "jui/lists/jlistCommands",
            "jui/lists/jlistWithCommands",

            "jui/forms/jinput",
            "jui/forms/jtextbox",
            "jui/forms/jtextarea",
            "jui/forms/jnumberbox",
            "jui/forms/jcheckbox",
            "jui/forms/jradiolist",
            "jui/forms/jcheckboxlist",
            "jui/forms/jselect",
            "jui/forms/jdatepicker",
            "jui/forms/jinputrepeat",
            "jui/forms/jinputgroup",
            "jui/forms/jtagbox",
            "jui/forms/jformCommands"
        ]);
    }
})();