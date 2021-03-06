Polymer({
  is: 'd4l-thunderclap-card',
  behaviors: [
    Polymer.D4LLogging,
    Polymer.D4LCardBehavior
  ],
  properties: {
    logLevel: {
      type: Number,
      value: 3
    },
    auth: {
      type: Object
    },
    db: {
      type: Object,
      notify: true
    },
    type: {
      type: String,
      value: 'storm'
    },
    campaign: {
      type: Object
    },
    metadata: {
      type: Object,
      notify: true
    },

    __userCountLabel: {
      type: String,
      computed: '__computeUserCountLabel(metadata.supporters.length, metadata)'
    },

    __thunderclapTime: {
      type: String,
      computed: '__computeThunderclapTime(metadata.thunderclapTime, metadata)'
    },
    __thunderClapDaysLeft: {
      type: String,
      computed: '__computeThunderClapLeft(__thunderclapTime)'
    },
    __thunderClapFormatted: {
      type: String,
      computed: '__computeThunderClapFormatted(__thunderclapTime)'
    }

  },

  observers: [
    '__campaignChanged(campaign, db.campaign.data.*)'
  ],

  __campaignChanged: function(){
    const campaignId = this.get('campaign.id');

    if (!campaignId) {
      this.__silly('__campaignChanged', 'Trying to link paths with no campaign id');
      return;
    }

    let metaData = this.get(['db.campaign.metadata', campaignId]);
    if (!metaData) {
      this.__silly('__campaignChanged', 'Init default metadata for', campaignId);
      const metaDefault = Object.assign({}, {
        __populate__: true,
        thunderclapTime: '',
        supporters: [],
        featured: ''
      });
      this.set(['db.campaign.metadata', campaignId], metaDefault);
    }

    this.set('metadata', this.get(['db.campaign.metadata', campaignId]));
    this.__silly('__campaignChanged', 'metadata linking path for', campaignId);
    this.linkPaths('metadata', `db.campaign.metadata.${campaignId}`);
  },

  __tap: function(){
    this.__subscribeThunderclap();
  },

  __viewThunderclap: function(){
    this.fire('view-entity', `/${this.type}/${this.get('campaign').id}`);
  },

  __subscribeThunderclap: function(){
    const campaign = this.get('campaign');

    this.fire('subscribe', {id: campaign.id, text: campaign.description});
  },

  __computeUserCountLabel: function(count){
    return count;
  },

  __computeThunderclapTime: function(time) {
    if (!time || !time === '') {
      return Sugar.Date.create('now');
    }

    return Sugar.Date.create(time);
  },
  __computeThunderClapLeft: function(time) {
    return Sugar.Date.relative(time);
  },
  __computeThunderClapFormatted: function(time) {
    return Sugar.Date.format(time, '{Dow} {do} {Month}, {12hr}:{mm}{tt}');
  }

});
