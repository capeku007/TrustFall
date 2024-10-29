import { defineStore } from "pinia";

export const useMainStore = defineStore("mainStore", {
  state: () => ({
    urlbase: "",
    dialoginfo: "",
    yesorNoClickFunc: { yesfunc: undefined, nofunc: undefined },
  }),

  actions: {
    changeDialog( payload) {
      this.dialoginfo = payload
      console.log(this.dialoginfo)
    },

    async OpenYesOrNOClick( payload) {
      console.log("Yes or No click opened")
      // $("#yesorno").modal('show')

      const $modalElement = document.querySelector("#confirmModal");
      if ($modalElement) {
        const modal = new Modal($modalElement);
        modal.show();
      }
      // {backdrop: 'static', keyboard: false},
      yesorNoClickFunc = payload;
      console.log(payload)
    },

    async confirm( payload) {
      if (yesorNoClickFunc.yesfunc) {
        console.log("Confirmed")
        // $("#yesorno").modal('hide')
        const $modalElement = document.querySelector('#confirmModal');
        if ($modalElement) {
          const modal = new Modal($modalElement);
          modal.hide();
        }
        await yesorNoClickFunc.yesfunc()
      }
  
    },
  
    async cancel( payload) {
      console.log("Cancelled")
      if (yesorNoClickFunc.nofunc) {
        await yesorNoClickFunc.nofunc()
      } else {
        console.log("in cancel no func")
      }
  
  
    },

  },

  getters: {
    
  },
});
