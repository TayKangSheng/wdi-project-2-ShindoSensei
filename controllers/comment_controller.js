let Comment = require('../models/comment')

let commentController = {

  show: (req, res) => {
    Comment.find({videoid: req.params.id}).populate('user').exec(function (err, doc) {
      if (err) {
        throw err
      }
      console.log(doc)
      res.render('videos/show', {
        videoId: req.params.id,
        submittedArray: doc,
        flash: req.flash('flash')[0]
      })
    })
  },

  create: (req, res) => {
    var newComment = new Comment({
      videoid: req.params.id,
      timingmin: req.body.timingmin,
      timingsec: req.body.timingsec,
      sugsub: req.body.sugsub,
      reason: req.body.reason,
      user: req.user._id,
      upvote: 0,
      upvotedusers: []
    })

    newComment.save(function (err, output) {
      if (err) {
        console.log(err)
      }
      req.user.local.comment.push(newComment)
      req.user.save()
      // Rendering comment page fragment into comment div
      Comment.find({
        videoid: req.params.id,
        timingmin: req.body.timingmin}).populate('user').sort({upvote: 'descending', timingsec: 'ascending'}).exec(function (err, doc) {
          if (err) {
            throw err
          }
          res.render('partials/comments', {
            layout: false,
            videoId: req.params.id,
            submittedArray: doc,
            minHide: 'hidden',
            secHide: ''
          // flash: req.flash('flash')[0]
          })
        })
    })
  },

  viewMin: (req, res) => {
    var showObj
    var minuteHide
    var secondHide
    if (req.body.minute === 'all') {
      showObj = {videoid: req.params.id}
      minuteHide = ''
      secondHide = 'hidden'
    } else {
      showObj = {videoid: req.params.id, timingmin: req.body.minute}
      minuteHide = 'hidden'
      secondHide = ''
    }
    Comment.find(
      showObj).populate('user').sort({upvote: 'descending', timingsec: 'ascending'}).exec(function (err, doc) {
        if (err) {
          throw err
        }
        res.render('partials/comments', {
          layout: false,
          videoId: req.params.id,
          submittedArray: doc,
          minHide: minuteHide,
          secHide: secondHide
        // flash: req.flash('flash')[0]
        })
      })
  },

  increment: (req, res) => {
 // function to increment upvotes on comment when clicked
    Comment.findById(req.query.commentid).populate('user').exec(function (err, doc) {
      if (err) {
        throw err
      }
      var usersUpvotedArr = doc.upvotedusers
      var isInArray = usersUpvotedArr.some(function (item) {
        return item.toString() === req.user._id.toString() // if any array elm === id, isInArray will be true
      })
      var newCount
      var commentUpvotes = doc.upvote  // Just added
      if (!isInArray) {
 // If user never upvote before, allow upvote
        console.log('Upvoting!')
        // newCount = parseInt(req.body.votecount) + 1 //just commented
        newCount = commentUpvotes + 1  // just added
        Comment.findByIdAndUpdate(req.query.commentid, {
          $push: {upvotedusers: req.user._id}, // pushing current user's id into upvotedusers array
          upvote: newCount// increasing vote count
        }, {new: true}, function (err, output) {
          if (err) { throw err }
          // res.redirect('/videos/' + req.params.id)
          res.send(newCount.toString())
        })
      } else {
        console.log('Downvoting!')
        newCount = commentUpvotes - 1
        Comment.findByIdAndUpdate(req.query.commentid, {
          $pull: {upvotedusers: req.user._id}, // pulling current user's id from upvotedusers array
          upvote: newCount // reducing vote count
        }, {new: true}, function (err, output) {
          if (err) { throw err }
          // res.redirect('/videos/' + req.params.id)
          res.send(newCount.toString())
        })
      }
    })
  },

  edit: (req, res) => {
    var updatedObject = {}
    if (req.body.name === 'timingmin') {
      updatedObject = {timingmin: req.body.value}
    } else if (req.body.name === 'timingsec') {
      updatedObject = {timingsec: req.body.value}
    } else if (req.body.name === 'sugsub') {
      updatedObject = {sugsub: req.body.value}
    } else if (req.body.name === 'reason') {
      updatedObject = {reason: req.body.value}
    }

    Comment.findByIdAndUpdate(req.query.commentid,
      updatedObject,
       {new: true}, function (err, output) {
         if (err) {
           throw err
         }
         console.log('Edited comment of id:' + req.query.commentid)
        //  console.log(req)
         res.redirect('/videos/' + req.params.id)
       })
  },

  delete: (req, res) => {
    Comment.findByIdAndRemove(req.query.commentid, function (err, output) {
      if (err) {
        throw err
      }
      console.log('Deleted comment of id:' + req.query.commentid)
      req.user.local.comment.splice(req.user.local.comment.indexOf(req.query.commentid), 1)
      req.user.save()
      Comment.find({
        videoid: req.params.id,
        timingmin: req.query.timeminute}).populate('user').sort({upvote: 'descending', timingsec: 'ascending'}).exec(function (err, doc) {
          if (err) {
            throw err
          }
          console.log(doc)
          res.render('partials/comments', {
            layout: false,
            videoId: req.params.id,
            submittedArray: doc,
            minHide: 'hidden',
            secHide: ''
          })
        })
    })
  }
}

module.exports = commentController
