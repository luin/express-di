var utils = require('..').utils;

describe('utils', function() {
  describe('.flatten()', function() {
    it('should flatten an array', function() {
      var arr = ['one', ['two', ['three', 'four'], 'five']];
      utils.flatten(arr)
        .should.eql(['one', 'two', 'three', 'four', 'five']);
    });
  });

  describe('.getParameters()', function() {
    it('should get the parameters', function() {
      var func1 = function() {};
      var func2 = function(a) {};
      var func3 = function(a, bc, defg) {};
      var func4 = () => {};
      var func5 = (a) => {};
      var func6 = (a, bc, defg) => {};
      var func7 = (a, bc, /* some comment */ defg) => {};
      utils.getParameters(func1).should.eql([]);
      utils.getParameters(func2).should.eql(['a']);
      utils.getParameters(func3).should.eql(['a', 'bc', 'defg']);
      utils.getParameters(func4).should.eql([]);
      utils.getParameters(func5).should.eql(['a']);
      utils.getParameters(func6).should.eql(['a', 'bc', 'defg']);
      utils.getParameters(func7).should.eql(['a', 'bc', 'defg']);
      // Test cache
      utils.getParameters(func3).should.eql(['a', 'bc', 'defg']);
      utils.getParameters(func6).should.eql(['a', 'bc', 'defg']);
    });
  });

  describe('.arraysEqual()', function() {
    it('should return true if the given arrays is equal', function() {
      utils.arraysEqual([], []).should.be.true;
      utils.arraysEqual([1], [1]).should.be.true;
      utils.arraysEqual(['foo', 'bar'], ['foo', 'bar']).should.be.true;
    });

    it('should return false if the given arrays is not equal', function() {
      utils.arraysEqual([], null).should.be.false;
      utils.arraysEqual([], 123).should.be.false;
      utils.arraysEqual([], [1]).should.be.false;
      utils.arraysEqual(['foo', 'bar'], ['foo']).should.be.false;
    });
  });

  describe('.needInject', function() {
    it('should return true if need inject', function() {
      utils.needInject(['user']).should.be.true;
      utils.needInject(['user', 'req']).should.be.true;
      utils.needInject(['', 'res']).should.be.true;
    });
    it('should return false if do not need inject', function() {
      utils.needInject([]).should.be.false;
      utils.needInject(['req']).should.be.false;
      utils.needInject(['req', 'res']).should.be.false;
      utils.needInject(['req', 'res', 'next']).should.be.false;
      utils.needInject(['err', 'req', 'res', 'next']).should.be.false;
      utils.needInject(['error', 'req', 'res', 'next']).should.be.false;
    });
  });
});
